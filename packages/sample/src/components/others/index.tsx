import Link from 'next/link';

const mediaData = [
  {
    link: 'https://particle.network/',
    text: 'Particle Website',
  },
  {
    link: 'https://twitter.com/ParticleNtwrk',
    text: 'Twitter',
  },
  {
    link: 'https://discord.com/invite/2y44qr6CR2',
    text: 'Discord',
  },
];

const Page = () => {
  return (
    <div className="text-primary container mx-auto flex h-full flex-col items-center justify-center gap-8 p-10 text-2xl font-bold">
      {mediaData.map((item) => {
        return (
          <Link key={item.link} href={item.link} target="_blank">
            {item.text}
          </Link>
        );
      })}
    </div>
  );
};

export default Page;
