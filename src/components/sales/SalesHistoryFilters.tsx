import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/formatDate";
import { format, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import React from "react";
import { useAtom, useAtomValue } from "jotai";
import { dateFilterAtom, selectedItemFilterAtom, selectedSectionFilterAtom, uniqueItemNamesAtom, uniqueSectionNamesAtom } from "@/store/salesAtoms";

function SalesHistoryFilters() {
  const [selectedItem, setSelectedItem] = useAtom(selectedItemFilterAtom);
  const [selectedSection, setSelectedSection] = useAtom(selectedSectionFilterAtom);
  const uniqueItemNames = useAtomValue(uniqueItemNamesAtom);
  const uniqueSectionNames = useAtomValue(uniqueSectionNamesAtom);
  const [dateFilter, setDateFilter] = useAtom(dateFilterAtom);
  const [dateFrom, setDateFrom] = React.useState<Date | undefined>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const [dateTo, setDateTo] = React.useState<Date | undefined>(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  });
  const [dateFromOpen, setDateFromOpen] = React.useState(false);
  const [dateToOpen, setDateToOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium">Select Item</label>
          <Select value={selectedItem} onValueChange={setSelectedItem}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select an item to filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              {uniqueItemNames.map(itemName => (
                <SelectItem key={itemName} value={itemName}>
                  {itemName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium">Select Section</label>
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select a section to filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              {uniqueSectionNames.map(sectionName => (
                <SelectItem key={sectionName} value={sectionName}>
                  {sectionName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">From Date</Label>
            <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
              <PopoverTrigger className="bg-white" asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={date => {
                    if (isValid(date)) {
                      setDateFrom(date);
                    }
                    setDateFromOpen(false);
                  }}
                  initialFocus
                  disabled={date => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex-1">
          <div className="space-y-1">
            <Label className="text-sm font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">To Date</Label>
            <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
              <PopoverTrigger className="bg-white" asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={date => {
                    if (isValid(date)) {
                      setDateTo(date);
                    }
                    setDateToOpen(false);
                  }}
                  initialFocus
                  disabled={date => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {selectedItem !== "all" && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              Item: {selectedItem}
              <button onClick={() => setSelectedItem("all")} className="ml-2 text-blue-600 hover:text-blue-800">
                ×
              </button>
            </Badge>
          )}
          {selectedSection !== "all" && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              Section: {selectedSection}
              <button onClick={() => setSelectedSection("all")} className="ml-2 text-green-600 hover:text-green-800">
                ×
              </button>
            </Badge>
          )}
          {(dateFrom || dateTo) && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
              {dateFrom && dateTo
                ? (() => {
                    const fromDateStr = format(dateFrom, "yyyy-MM-dd");
                    const toDateStr = format(dateTo, "yyyy-MM-dd");
                    const today = format(new Date(), "yyyy-MM-dd");

                    if (fromDateStr === toDateStr) {
                      return fromDateStr === today ? "Today" : format(dateFrom, "MMM d, yyyy");
                    }
                    return `${format(dateFrom, "MMM d")} - ${format(dateTo, "MMM d, yyyy")}`;
                  })()
                : dateFrom
                  ? `From: ${format(dateFrom, "MMM d, yyyy")}`
                  : `To: ${format(dateTo!, "MMM d, yyyy")}`}
              <button
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                  setDateFilter("");
                }}
                className="ml-2 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </Badge>
          )}
          {dateFilter && !dateFrom && !dateTo && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
              Date: {formatDate(new Date(dateFilter))}
              <button onClick={() => setDateFilter("")} className="ml-2 text-purple-600 hover:text-purple-800">
                ×
              </button>
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2 ml-auto">
          <Button
            variant={(() => {
              if (!dateFrom || !dateTo) return "outline";
              const today = new Date();
              const todayStart = new Date(today);
              todayStart.setHours(0, 0, 0, 0);
              const todayEnd = new Date(today);
              todayEnd.setHours(23, 59, 59, 999);

              const isToday = dateFrom.getTime() === todayStart.getTime() && dateTo.getTime() === todayEnd.getTime();
              return isToday ? "default" : "outline";
            })()}
            size="sm"
            onClick={() => {
              const today = new Date();
              const todayStart = new Date(today);
              todayStart.setHours(0, 0, 0, 0);
              const todayEnd = new Date(today);
              todayEnd.setHours(23, 59, 59, 999);
              setDateFrom(todayStart);
              setDateTo(todayEnd);
              setDateFilter("");
            }}
            className="transition-all duration-200"
          >
            📅 Today
          </Button>

          <Button
            variant={(() => {
              if (!dateFrom || !dateTo) return "outline";
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStart = new Date(yesterday);
              yesterdayStart.setHours(0, 0, 0, 0);
              const yesterdayEnd = new Date(yesterday);
              yesterdayEnd.setHours(23, 59, 59, 999);

              const isYesterday = dateFrom.getTime() === yesterdayStart.getTime() && dateTo.getTime() === yesterdayEnd.getTime();
              return isYesterday ? "default" : "outline";
            })()}
            size="sm"
            onClick={() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStart = new Date(yesterday);
              yesterdayStart.setHours(0, 0, 0, 0);
              const yesterdayEnd = new Date(yesterday);
              yesterdayEnd.setHours(23, 59, 59, 999);
              setDateFrom(yesterdayStart);
              setDateTo(yesterdayEnd);
              setDateFilter("");
            }}
            className="transition-all duration-200"
          >
            📅 Yesterday
          </Button>

          <Button
            variant={(() => {
              if (!dateFrom || !dateTo) return "outline";
              const today = new Date();
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - today.getDay());
              startOfWeek.setHours(0, 0, 0, 0);
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6);
              endOfWeek.setHours(23, 59, 59, 999);

              const isThisWeek = dateFrom.getTime() === startOfWeek.getTime() && dateTo.getTime() === endOfWeek.getTime();
              return isThisWeek ? "default" : "outline";
            })()}
            size="sm"
            onClick={() => {
              const today = new Date();
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - today.getDay());
              startOfWeek.setHours(0, 0, 0, 0);
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 6);
              endOfWeek.setHours(23, 59, 59, 999);
              setDateFrom(startOfWeek);
              setDateTo(endOfWeek);
              setDateFilter("");
            }}
            className="transition-all duration-200"
          >
            📅 This Week
          </Button>

          {(selectedItem !== "all" || selectedSection !== "all" || dateFilter || dateFrom || dateTo) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedItem("all");
                setSelectedSection("all");
                setDateFilter("");
                setDateFrom(undefined);
                setDateTo(undefined);
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-all duration-200"
            >
              🗑️ Clear All
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SalesHistoryFilters;
