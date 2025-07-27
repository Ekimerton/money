import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface AccountNamePopoverProps {
    defaultValue: string;
    onSubmit: (value: string) => void;
}

export function AccountNamePopover({ defaultValue, onSubmit }: AccountNamePopoverProps) {
    const [inputValue, setInputValue] = useState(defaultValue);
    const [open, setOpen] = useState(false);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSubmit(inputValue);
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="cursor-pointer hover:underline">
                    {defaultValue}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <div className="grid gap-2">
                    <Input
                        type="text"
                        placeholder="Account Name"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
} 