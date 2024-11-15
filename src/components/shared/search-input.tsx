interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: SearchInputProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className="w-full p-2 border rounded"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
