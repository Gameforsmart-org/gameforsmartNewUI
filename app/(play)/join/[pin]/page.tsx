import Join from "../component/join";

interface JoinPinPageProps {
  params: Promise<{ pin: string }>;
}

export default async function JoinPinPage({ params }: JoinPinPageProps) {
  const { pin } = await params;
  return <Join initialPin={pin} />;
}
