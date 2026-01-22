/**
 * This component contains my personal motto:
 * "Only you know who you can be."
 * It appears vertically and rotated at the bottom of the screen.
 */
export function Motto() {
  return (
    <p className='uppercase text-xs [writing-mode:vertical-lr] rotate-180 fixed bottom-20 my-1 tracking-wider mx-3 text-[#3d2800] hover:text-[#3847E6] max-sm:hidden transition-all duration-300 cursor-default'>
      Only you know who you can be
    </p>
  );
}
