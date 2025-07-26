import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface CategoryPopoverProps {
    defaultValue: string;
    suggestions: string[];
    onSubmit: (value: string) => void;
}

export function CategoryPopover({ defaultValue, suggestions, onSubmit }: CategoryPopoverProps) {
    const [inputValue, setInputValue] = useState(defaultValue);
    const [open, setOpen] = useState(false); // Add state to control popover open/closed state

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSubmit(inputValue);
            setOpen(false); // Close popover on submit
        }
    };

    const handleBadgeClick = (suggestion: string) => {
        onSubmit(suggestion);
        setOpen(false); // Close popover on badge click
    };

    return (
        <Popover open={open} onOpenChange={setOpen}> {/* Bind open state to Popover component */}
            <PopoverTrigger asChild>
                <Badge
                    variant={defaultValue === 'Uncategorized' ? 'destructive' : 'default'}
                    className="cursor-pointer"
                >
                    {defaultValue}
                </Badge>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <div className="grid gap-2">
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion) => (
                            <Badge
                                key={suggestion}
                                variant="default"
                                className="cursor-pointer"
                                onClick={() => handleBadgeClick(suggestion)}
                            >
                                {suggestion}
                            </Badge>
                        ))}
                    </div>
                    <Input
                        type="text"
                        placeholder="Custom field"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
} 