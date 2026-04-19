import { SparklesIcon } from "@heroicons/react/24/outline";
import { lusitana } from "@/app/ui/fonts";

export default function ATLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <SparklesIcon className="h-8 w-8 md:h-12 md:w-12 shrink-0" />
      <p className="text-[40px]"> Aksumite</p>
    </div>
  );
}
