import { GetServerSideProps, NextPage } from 'next';

interface Props {}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  context.res.statusCode = 429;
  context.res.end('Too Many Requests');

  return {
    props: {}, // 必要に応じてpropsを設定しますが、通常は空にします
  };
};

const Page: NextPage<Props> = () => {
  return (
    <div>
      <h1>429 Too Many Requests</h1>
      <p>このページはアクセス制限されています。</p>
    </div>
  );
};

export default Page;