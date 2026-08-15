import SendbirdChat, { type SendbirdChatWith } from '@sendbird/chat';
import { GroupChannelModule } from '@sendbird/chat/groupChannel';

export type SendbirdSdk = SendbirdChatWith<[GroupChannelModule]>;

let sdkInstance: SendbirdSdk | null = null;
let sdkAppId: string | null = null;

// appId는 세션 토큰 발급 응답으로만 알 수 있어 빌드 타임에는 알 수 없다. 최초 연결 시점에
// 받은 appId로 초기화하고, 같은 appId로 다시 요청되면 기존 인스턴스를 그대로 재사용한다
// (로그아웃 후 재로그인처럼 유저만 바뀌는 경우 새 인스턴스를 또 만들 필요가 없다)
export function getSendbirdSdk(appId: string): SendbirdSdk {
   if (sdkInstance && sdkAppId === appId) return sdkInstance;
   sdkInstance = SendbirdChat.init({
      appId,
      modules: [new GroupChannelModule()],
   });
   sdkAppId = appId;
   return sdkInstance;
}
