"use client";

import React, { useEffect, useRef, useState } from "react";
import Input from "@/components/ui/inputs/Input";
import { IoSearchSharp } from "react-icons/io5";

interface SearchInputProps {
  value: string;
  onDebouncedChange: (value: string) => void;
  delay?: number;
  placeholder?: string;
  className?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onDebouncedChange,
  delay = 350,
  placeholder = "Search...",
  className = "",
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const callbackRef = useRef(onDebouncedChange);
  // The text already handed to the parent. Comparing against it — rather than a
  // "first render" flag — keeps StrictMode's double-invoked mount effect silent:
  // the flag is spent by the discarded pass, so the timer would fire on mount
  // and push an unchanged query back into the URL.
  const emittedValue = useRef(value);
  // The value last seen coming down from the URL, so that a reset or a
  // back/forward navigation can re-seed the field without echoing the parent's
  // own write straight back into the router.
  const receivedValue = useRef(value);

  useEffect(() => {
    callbackRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  useEffect(() => {
    if (receivedValue.current === value) return;

    receivedValue.current = value;
    emittedValue.current = value;
    // The URL holds the truth for this field, so a value written from outside
    // (Reset, back/forward) has to land in the local text before the next keystroke.
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    if (internalValue === emittedValue.current) return;

    const handler = setTimeout(() => {
      emittedValue.current = internalValue;
      callbackRef.current(internalValue);
    }, delay);

    return () => clearTimeout(handler);
  }, [internalValue, delay]);

  return (
    <div className={`relative w-full ${className}`}>
      <Input
        type="text"
        icon={<IoSearchSharp className="h-4 w-4" />}
        placeholder={placeholder}
        value={internalValue}
        onChange={(event) => setInternalValue(event.target.value)}
        aria-label={placeholder}
      />
    </div>
  );
};

export default SearchInput;
