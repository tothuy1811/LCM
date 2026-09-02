"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { type DateRange } from "react-day-picker";

type DatePickerWithRangeProps = {
  id?: string;
  label?: string;
  className?: string;
  placeholder?: string;
  initialRange?: DateRange;
  numberOfMonths?: number;
  onChange?: (range: DateRange | undefined) => void;
};

function getDefaultRange(): DateRange {
  const from = new Date(new Date().getFullYear(), 0, 20);
  return {
    from,
    to: addDays(from, 20),
  };
}

export function DatePickerWithRange({
  id = "date-picker-range",
  label = "Date Picker Range",
  className = "mx-auto w-60",
  placeholder = "Pick a date",
  initialRange = getDefaultRange(),
  numberOfMonths = 2,
  onChange,
}: DatePickerWithRangeProps) {
  const [date, setDate] = React.useState<DateRange | undefined>(initialRange);

  React.useEffect(() => {
    setDate(initialRange);
  }, [initialRange]);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    onChange?.(range);
  };

  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            className="justify-start px-2.5 font-normal"
          >
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={numberOfMonths}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}
