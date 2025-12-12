import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers/oauth';
import { PROVIDER_COLORS } from './constants';

export interface WeChatProfile {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  unionid?: string;
}

export interface WeChatProviderConfig extends OAuthUserConfig<WeChatProfile> {
  /**
   * WeChat App ID from WeChat Open Platform
   */
  clientId: string;
  /**
   * WeChat App Secret from WeChat Open Platform
   */
  clientSecret: string;
}

/**
 * Custom WeChat OAuth Provider for NextAuth
 * Supports both:
 * - Web QR code login (desktop browsers)
 * - WeChat in-app browser login
 */
export default function WeChatProvider(
  options: WeChatProviderConfig
): OAuthConfig<WeChatProfile> {
  return {
    id: 'wechat',
    name: 'WeChat',
    type: 'oauth',
    // WeChat uses custom parameter names
    authorization: {
      url: 'https://open.weixin.qq.com/connect/qrconnect',
      params: {
        appid: options.clientId,
        response_type: 'code',
        scope: 'snsapi_login',
        state: Math.random().toString(36).substring(7),
      },
    },
    token: {
      url: 'https://api.weixin.qq.com/sns/oauth2/access_token',
      async request({ params, provider }) {
        const response = await fetch(
          `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${provider.clientId}&secret=${provider.clientSecret}&code=${params.code}&grant_type=authorization_code`
        );
        const data = await response.json();

        if (data.errcode) {
          throw new Error(`WeChat token error: ${data.errmsg}`);
        }

        return {
          tokens: {
            access_token: data.access_token,
            token_type: 'Bearer',
            expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
            refresh_token: data.refresh_token,
            // Store openid for userinfo request
            id_token: data.openid,
          },
        };
      },
    },
    userinfo: {
      url: 'https://api.weixin.qq.com/sns/userinfo',
      async request({ tokens }) {
        const response = await fetch(
          `https://api.weixin.qq.com/sns/userinfo?access_token=${tokens.access_token}&openid=${tokens.id_token}&lang=zh_CN`
        );
        const data = await response.json();

        if (data.errcode) {
          throw new Error(`WeChat userinfo error: ${data.errmsg}`);
        }

        return data;
      },
    },
    profile(profile) {
      return {
        id: profile.unionid || profile.openid,
        name: profile.nickname,
        email: null, // WeChat doesn't provide email
        image: profile.headimgurl,
      };
    },
    style: {
      bg: PROVIDER_COLORS.WECHAT.bg,
      text: '#fff',
      logo: 'https://authjs.dev/img/providers/wechat.svg',
    },
    options,
  };
}

/**
 * WeChat OAuth Provider for in-app browser (when user is inside WeChat)
 * Uses different authorization endpoint with snsapi_userinfo scope
 */
export function WeChatMPProvider(
  options: WeChatProviderConfig
): OAuthConfig<WeChatProfile> {
  return {
    ...WeChatProvider(options),
    id: 'wechat-mp',
    name: 'WeChat (In-App)',
    authorization: {
      url: 'https://open.weixin.qq.com/connect/oauth2/authorize',
      params: {
        appid: options.clientId,
        response_type: 'code',
        scope: 'snsapi_userinfo',
        state: Math.random().toString(36).substring(7),
      },
    },
    options,
  };
}

/**
 * Detect if the user is in WeChat's in-app browser
 */
export function isWeChatBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
}
