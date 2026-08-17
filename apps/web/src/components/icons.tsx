export function DashboardSquare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <rect x="3" y="3" width="9.5" height="5.5" rx="2.25" />
      <rect x="15.5" y="3" width="5.5" height="9.5" rx="2.25" />
      <rect x="3" y="11.5" width="9.5" height="9.5" rx="2.25" />
      <rect x="15.5" y="15.5" width="5.5" height="5.5" rx="2.25" />
    </svg>
  );
}
