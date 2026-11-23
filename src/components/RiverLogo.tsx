interface RiverLogoProps {
  className?: string;
}

export function RiverLogo({ className = "size-10" }: RiverLogoProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="44" height="44" rx="15" fill="#0F4C48" />
      <path
        d="M13 10.5C19.5 15 25 15 31 19.5C24.5 24 19.5 24 13 28.5C18.5 32 23.5 33 31 33.5"
        stroke="#D7F3E8"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 10.5C19.5 15 25 15 31 19.5"
        stroke="#83D5C4"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="10.5" r="2" fill="#83D5C4" />
      <circle cx="31" cy="33.5" r="2" fill="#83D5C4" />
    </svg>
  );
}
