interface LogoProps {
  size?: number;
}

export default function Logo({ size = 28 }: LogoProps) {
  return (
    <img
      src="/logo192.png"
      alt="Logo"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
    />
  );
} 