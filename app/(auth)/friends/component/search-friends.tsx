"use client";

import { useState, useEffect, forwardRef } from "react";
import { Funnel, MapPin, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { LocationSelector, type LocationValue } from "@/components/ui/location-selector";

const EMPTY_LOCATION: LocationValue = {
  countryId: null,
  stateId: null,
  cityId: null,
  countryName: "",
  stateName: "",
  cityName: "",
  latitude: null,
  longitude: null
};

interface SearchFriendsProps {
  activeTab: string;
  onSearch: (query: string) => void;
  locationFilter: LocationValue;
  setLocationFilter: (val: LocationValue) => void;
  onApplyFilter: () => void;
}

export const SearchFriends = forwardRef<HTMLInputElement, SearchFriendsProps>(
  ({ activeTab, onSearch, locationFilter, setLocationFilter }, ref) => {
    const [inputValue, setInputValue] = useState("");
    const [tempLocation, setTempLocation] = useState<LocationValue>(locationFilter);

    useEffect(() => {
      setInputValue("");
    }, [activeTab]);

    useEffect(() => {
      setTempLocation(locationFilter);
    }, [locationFilter]);

    const handleSearchTrigger = () => {
      onSearch(inputValue);
    };

    const handleApplyLocation = () => {
      setLocationFilter(tempLocation);
    };

    const handleResetLocation = () => {
      setTempLocation({ ...EMPTY_LOCATION });
    };

    return (
      <div className="flex w-full items-center space-x-2">
        {/* Location Filter Dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="button-yellow">
              <Funnel className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="dialog sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-950 dark:text-orange-200">
                Filter Location <MapPin size={16} />
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <LocationSelector
                value={tempLocation}
                onChange={setTempLocation}
                layout="vertical"
                showDetectButton={false}
              />
            </div>
            <DialogFooter className="flex w-full flex-row items-center justify-between sm:justify-between">
              <Button
                variant="outline"
                onClick={handleResetLocation}
                className="button-yellow-outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <div className="flex items-center gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    variant="default"
                    onClick={handleApplyLocation}
                    className="button-orange">
                    Apply
                  </Button>
                </DialogClose>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Search Input */}
        <div className="relative w-full flex-1 sm:w-auto sm:flex-none">
          <Input
            ref={ref}
            id="friends-search-input"
            placeholder="Press K or Click to Search..."
            className="input pr-10 sm:w-[250px]"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
          />
          <Button
            onClick={handleSearchTrigger}
            className="button-orange absolute top-1 right-1 h-7 w-7">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }
);

SearchFriends.displayName = "SearchFriends";
