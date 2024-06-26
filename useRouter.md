`next/navigation`の`useRouter`は、`next/router`の`useRouter`とは異なり、いくつかの機能がサポートされていません。以下の表に、主要な機能の対応状況をまとめました。また、サポートされていない機能については、代替モジュールも記載します。

| 機能               | `next/router`             | `next/navigation`        | 代替モジュール                                   |
|--------------------|---------------------------|--------------------------|----------------------------------------------|
| .push()            | Yes                       | Yes                      | N/A                                          |
| .replace()         | Yes                       | Yes                      | N/A                                          |
| .back()            | Yes                       | No                       | `window.history.back()`                      |
| .forward()         | Yes                       | No                       | `window.history.forward()`                   |
| .prefetch()        | Yes                       | No                       | `next/link`でprefetch属性を使用               |
| asPath             | Yes                       | No                       | `usePathname` (from `next/navigation`)       |
| pathname           | Yes                       | No                       | `usePathname` (from `next/navigation`)       |
| query              | Yes                       | No                       | `useSearchParams` (from `next/navigation`)   |
| params             | Yes                       | No                       | `useParams` (from `next/navigation`)         |

### 詳細と代替方法

1. **バック/フォワードナビゲーション**
   `next/navigation`では`.back()`や`.forward()`がサポートされていませんが、代わりにブラウザのネイティブな`window.history.back()`や`window.history.forward()`を使用することが推奨されます。

2. **URL情報の取得**
   - **`asPath`**: `next/router`の`asPath`に相当する機能は`next/navigation`には直接ありませんが、`usePathname`フックを使って現在のパスを取得できます。
   - **`pathname`**: 同様に、現在のパスは`usePathname`フックで取得できます。
   - **`query`**: クエリパラメータを取得するには、`useSearchParams`フックを使用します。
   - **`params`**: 動的パラメータを取得するには、`useParams`フックを使用します。

これらの新しいフックはすべて`next/navigation`からインポートできます [oai_citation:1,Routing: Linking and Navigating | Next.js](https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating) [oai_citation:2,Next.js 13 で URL の情報を取得する方法を整理する 〖useRouter・useSearchParams・usePathname・useParams〗(next/navigation) #ルーティング - Qiita](https://qiita.com/RANZU/items/0037cbb04d8716944b0e) [oai_citation:3,Difference between next/router and next/navigation · vercel next.js · Discussion #48426 · GitHub](https://github.com/vercel/next.js/discussions/48426) [oai_citation:4,Building Your Application: Routing | Next.js](https://nextjs.org/docs/app/building-your-application/routing)。

次に具体的なインポート例を示します。

```typescript
import { usePathname, useSearchParams, useParams } from 'next/navigation';

// パスの取得
const pathname = usePathname();

// クエリパラメータの取得
const searchParams = useSearchParams();
const queryParam = searchParams.get('paramName');

// 動的パラメータの取得
const params = useParams();
const dynamicParam = params.id;
```

これにより、`next/router`から`next/navigation`への移行がスムーズに行えるようになります。詳細な公式ドキュメントは[Next.js公式サイト](https://nextjs.org/docs)で確認できます。