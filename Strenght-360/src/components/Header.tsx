export function Header() {
  const logoPath = '/atria-logo.jpg';

  return (
    <header className="w-full bg-orange-50">
      <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-center">
        <img
          src={logoPath}
          alt="Atria University"
          className="h-32 w-auto object-contain"
        />
      </div>
    </header>
  );
}
