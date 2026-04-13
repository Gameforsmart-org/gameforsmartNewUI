"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { LocationValue } from "@/components/ui/location-selector";
import {
  getFollowedIds,
  getProfileIdsByTab,
  getProfiles
} from "../services/friends.service";
import type { Profile, TabKey } from "../types";

const INITIAL_LOCATION: LocationValue = {
  countryId: null,
  stateId: null,
  cityId: null,
  countryName: "",
  stateName: "",
  cityName: "",
  latitude: null,
  longitude: null
};

const INITIAL_LOCATION_FILTERS: Record<TabKey, LocationValue> = {
  friends: { ...INITIAL_LOCATION },
  following: { ...INITIAL_LOCATION },
  follower: { ...INITIAL_LOCATION },
  find: { ...INITIAL_LOCATION }
};

const INITIAL_SEARCH_QUERIES: Record<TabKey, string> = {
  friends: "",
  following: "",
  follower: "",
  find: ""
};

export function useFriendsData(currentUserId: string, activeTab: TabKey) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [searchQueries, setSearchQueries] = useState(INITIAL_SEARCH_QUERIES);
  const [locationFilters, setLocationFilters] = useState(INITIAL_LOCATION_FILTERS);

  const currentLocationFilter = locationFilters[activeTab];
  const currentSearchQuery = searchQueries[activeTab];

  const handleSearch = (query: string) => {
    setSearchQueries((prev) => ({ ...prev, [activeTab]: query }));
  };

  const updateLocationFilter = (val: LocationValue) => {
    setLocationFilters((prev) => ({ ...prev, [activeTab]: val }));
  };

  const fetchData = async () => {
    setLoading(true);
    setUsers([]);

    try {
      // Pre-fetch followed IDs untuk tab "find" dan "follower"
      if (activeTab === "find" || activeTab === "follower") {
        const ids = await getFollowedIds(currentUserId);
        setFollowedIds(ids);
      } else {
        setFollowedIds([]);
      }

      // Ambil profile IDs berdasarkan relasi tab
      const profileIds =
        activeTab === "find"
          ? []
          : await getProfileIdsByTab(currentUserId, activeTab);

      // Fetch profil dengan filter
      const data = await getProfiles({
        tab: activeTab,
        currentUserId,
        profileIds,
        search: currentSearchQuery,
        locationFilter: {
          countryId: currentLocationFilter.countryId,
          stateId: currentLocationFilter.stateId,
          cityId: currentLocationFilter.cityId
        }
      });

      setUsers(data);
    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentSearchQuery, currentLocationFilter]);

  return {
    users,
    loading,
    followedIds,
    currentLocationFilter,
    handleSearch,
    updateLocationFilter,
    fetchData
  };
}
