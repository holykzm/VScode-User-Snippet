## 現在の `useApi` の構成

`useApi` は、指定された API クラスのインスタンスを生成するカスタムフックです。このフックは、ブラウザ環境かどうかをチェックしてから、適切に API クラスのインスタンスを返します。以下に示すのは、その構成の抜粋です。

```typescript
export const useApi = <T extends BaseAPI>(
  TargetAPI: new (config: Configuration) => T
): T => {
  const isBrowser = typeof window !== "undefined";
  const newApiConfig = isBrowser ? getApiConfigClient() : getApiConfig();

  // CSR
  if (isBrowser) {
    newApiConfig.middleware.push({
      post: async (context): Promise<Response> => {
        const { response } = context;
        switch (response?.status) {
          case 200:
          case 204:
            return response;
          // ... 省略 ...
          default:
            // ... エラーの処理 ...
            return response;
        }
      }
    });
  } else {
    // SSR
    newApiConfig.middleware.push({
      post: async (context): Promise<Response> => {
        const { response } = context;
        switch (response?.status) {
          // ... 省略 ...
        }
      }
    });
  }

  return new TargetAPI(newApiConfig);
}
```

## `api.ts` の構成

`getApiConfig` と `getApiConfigClient` は、環境ごとに異なる API 設定を返す関数です。

```typescript
import { fetch } from 'node-fetch';

export const getApiConfig = () => 
  new Configuration({
    basePath: process.env.BASE_PATH,
    fetchApi: fetch,
    middleware: [
      {
        pre: async (context) => {
          const hostChangeInt = context.int;
          hostChangeInt.headers = {
            ...hostChangeInt.headers,
            Host: process.env.DOMAIN as string,
          };
          return {
            int: hostChangeInt,
            url: context.url,
            // ... 省略 ...
          };
        }
      }
    ],
  });

export const getApiConfigClient = () => 
  new Configuration({
    basePath: process.env.NEXT_PUBLIC_BASE,
    middleware: [],
  });
```

## `runtime.ts` の構成

`Configuration` クラスは、API の設定を管理するためのクラスです。

```typescript
export interface ConfigurationParameters {
  basePath?: string;
  fetchApi?: FetchApi;
  middleware?: Middleware[];
  // ... 省略 ...
}

export class Configuration {
  constructor(private configuration: ConfigurationParameters = {}) {}

  set config(configuration: Configuration) {
    this.configuration = configuration;
  }

  get basePath(): string {
    return this.configuration.basePath != null ? this.configuration.basePath : BASE_PATH;
  }

  get fetchApi(): FetchApi | undefined {
    return this.configuration.fetchApi;
  }

  // ... 省略 ...
}
```

## AbortController の追加

`useApi` フックに `AbortController` を追加し、180秒以上経った時のリクエストをキャンセルする方法を示します。

```typescript
export const useApi = <T extends BaseAPI>(
  TargetAPI: new (config: Configuration) => T
): T => {
  const isBrowser = typeof window !== "undefined";
  const newApiConfig = isBrowser ? getApiConfigClient() : getApiConfig();

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 180000); // 180秒

  // CSR
  if (isBrowser) {
    newApiConfig.middleware.push({
      post: async (context): Promise<Response> => {
        const { response } = context;
        clearTimeout(timeoutId); // リクエストが成功または失敗した場合にタイムアウトをクリア
        switch (response?.status) {
          case 200:
          case 204:
            return response;
          // ... 省略 ...
          default:
            // ... エラーの処理 ...
            return response;
        }
      },
      pre: async (context) => {
        context.init = { ...context.init, signal: abortController.signal };
        return context;
      }
    });
  } else {
    // SSR
    newApiConfig.middleware.push({
      post: async (context): Promise<Response> => {
        const { response } = context;
        clearTimeout(timeoutId); // リクエストが成功または失敗した場合にタイムアウトをクリア
        switch (response?.status) {
          // ... 省略 ...
        }
      },
      pre: async (context) => {
        context.init = { ...context.init, signal: abortController.signal };
        return context;
      }
    });
  }

  return new TargetAPI(newApiConfig);
}
```

## 構成を理解するための文章
### 構成を理解するための文章

## やらないといけないこと
設計書に書いてある「abortController」が実装できていないので実装する。

## 直面している問題
- `abortController`の知見がない
- 当初のメンバーがいないのでコードを分析しないと構成がわからない
- `node-fetch`の知見もない
- `class`を知らないので`new Configuration`で何をしているのかも全くわからない
- これらの理由で`abortController`が実装できるのか、どこにどうやって実装するのかがわからない

## 調査結果
- `useApi`でリクエストしているので、これを加工することで一元的に`abortController`を実装できそうだ
- `useApi`ではCSRとSSRで別の関数を使用して`newApiConfig`という`Configuration`クラスのインスタンスを使用している
- その関数である`getApiConfig`と`getApiConfigClient`の違いは、インスタンス作成時に`fetchApi`を指定しているかどうかだが、なぜクライアントには`fetchApi`を指定していないのだろうか？
  - クライアントサイドではブラウザの`fetch`が自動的に使用されるため、明示的に`fetchApi`を指定する必要がないと考えられる

## 実装手順
1. `useApi`フックに`AbortController`を追加し、180秒以上経過したリクエストをキャンセルする処理を追加する
2. 具体的には、以下のように`abortController`を`useApi`フック内で設定し、ミドルウェアで`signal`を設定する

```typescript
export const useApi = <T extends BaseAPI>(
  TargetAPI: new (config: Configuration) => T
): T => {
  const isBrowser = typeof window !== "undefined";
  const newApiConfig = isBrowser ? getApiConfigClient() : getApiConfig();

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 180000); // 180秒

  // CSR
  if (isBrowser) {
    newApiConfig.middleware.push({
      post: async (context): Promise<Response> => {
        const { response } = context;
        clearTimeout(timeoutId); // リクエストが成功または失敗した場合にタイムアウトをクリア
        switch (response?.status) {
          case 200:
          case 204:
            return response;
          // ... 省略 ...
          default:
            // ... エラーの処理 ...
            return response;
        }
      },
      pre: async (context) => {
        context.init = { ...context.init, signal: abortController.signal };
        return context;
      }
    });
  } else {
    // SSR
    newApiConfig.middleware.push({
      post: async (context): Promise<Response> => {
        const { response } = context;
        clearTimeout(timeoutId); // リクエストが成功または失敗した場合にタイムアウトをクリア
        switch (response?.status) {
          // ... 省略 ...
        }
      },
      pre: async (context) => {
        context.init = { ...context.init, signal: abortController.signal };
        return context;
      }
    });
  }

  return new TargetAPI(newApiConfig);
}
```

## 構成の理解
- `useApi`フックは、クライアントサイドレンダリング（CSR）とサーバーサイドレンダリング（SSR）で異なるAPI設定を使用する
- `Configuration`クラスはAPI設定を管理し、`getApiConfig`と`getApiConfigClient`関数はそれぞれSSRとCSR用の設定を返す
- `AbortController`を使用して、180秒以上経過したリクエストをキャンセルする処理を追加することで、大きなファイルのアップロードや遅い回線での対応を行う


---
```
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (count < 15) {
      const timer = setTimeout(() => setCount(count + 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [count]);
```
