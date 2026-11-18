import { Button } from "@/Components/ui/button";
import { Calendar } from "@/Components/ui/calendar";
import { Input } from "@/Components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";

/**
 * Pemilih tanggal (+ jam) bergaya shadcn, sama seperti form ujian di halaman kelas.
 * Nilai disimpan sebagai teks lokal: "YYYY-MM-DD" (tanpa jam) atau "YYYY-MM-DDTHH:mm".
 */
type Props = {
    value: string;
    onChange: (value: string) => void;
    withTime?: boolean;
    placeholder?: string;
    className?: string;
    defaultTime?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

function toDate(value: string): Date | undefined {
    const [datePart] = value.split("T");
    const [y, m, d] = (datePart || "").split("-").map(Number);
    return y && m && d ? new Date(y, m - 1, d) : undefined;
}

export default function DateTimeField({ value, onChange, withTime = true, placeholder = "Pilih tanggal", className, defaultTime = "08:00" }: Props) {
    const [open, setOpen] = useState(false);
    const date = value ? toDate(value) : undefined;
    const time = value.includes("T") ? value.split("T")[1].slice(0, 5) : "";

    const emit = (nextDate: Date | undefined, nextTime: string) => {
        if (!nextDate) {
            onChange("");
            return;
        }
        const datePart = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(nextDate.getDate())}`;
        onChange(withTime ? `${datePart}T${nextTime || defaultTime}` : datePart);
    };

    return (
        <div className={cn(withTime ? "grid grid-cols-[minmax(0,1fr)_96px] gap-2" : "", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className={cn("h-9 w-full min-w-0 justify-start rounded-xl px-3 text-left font-normal", !date && "text-muted-foreground")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        <span className="truncate">{date ? format(date, "EEE, d MMM yyyy", { locale: id }) : placeholder}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        defaultMonth={date}
                        toYear={new Date().getFullYear() + 3}
                        onSelect={(next) => {
                            emit(next, time);
                            setOpen(false);
                        }}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
            {withTime && (
                <Input
                    type="time"
                    className="h-9"
                    value={time}
                    disabled={!date}
                    onChange={(e) => emit(date, e.target.value)}
                />
            )}
        </div>
    );
}
