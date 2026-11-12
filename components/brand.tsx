export function PostouMark({size=36,className}:{size?:number;className?:string}) {
  return <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Postou" className={className}>
    <rect width="64" height="64" rx="18" fill="#5B3DF5"/>
    <polygon points="14,33 50,14 38,50 31,37" fill="#FFFFFF"/>
    <path d="M31 37 L50 14" stroke="#5B3DF5" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <circle cx="17" cy="47" r="4.5" fill="#FF6B5A"/>
  </svg>;
}
