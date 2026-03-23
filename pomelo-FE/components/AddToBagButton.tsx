interface AddToBagButtonProps {
  onClick?: () => void;
}

export default function AddToBagButton({
  onClick
}: AddToBagButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full border border-black bg-black px-4 py-3 text-sm uppercase tracking-[0.14em] text-white transition hover:bg-[#2a2621]"
    >
      Agregar al carrito
    </button>
  );
}
