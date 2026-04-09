"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface ChartItem {
  name: string;
  value: number;
}

interface QuizChartProps {
  quizId: string;
}

export default function QuizChart({ quizId }: QuizChartProps) {
  const [countryData, setCountryData] = useState<ChartItem[]>([]);
  const [stateData, setStateData] = useState<ChartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLocationData() {
      setLoading(true);
      try {
        // Fetch sessions that use this quiz, join country and state names
        const { data: sessions, error } = await supabase
          .from("game_sessions")
          .select(
            `country_id, state_id,
             countries!game_sessions_country_id_fkey(name),
             states!game_sessions_state_id_fkey(name)`
          )
          .eq("quiz_id", quizId);

        if (error) {
          console.error("[QuizChart] fetch error:", error);
          return;
        }

        if (!sessions || sessions.length === 0) {
          setCountryData([]);
          setStateData([]);
          return;
        }

        // Aggregate country counts
        const countryMap = new Map<string, number>();
        const stateMap = new Map<string, number>();

        sessions.forEach((s: any) => {
          const countryName =
            (Array.isArray(s.countries) ? s.countries[0]?.name : s.countries?.name) || null;
          const stateName =
            (Array.isArray(s.states) ? s.states[0]?.name : s.states?.name) || null;

          if (countryName) {
            countryMap.set(countryName, (countryMap.get(countryName) || 0) + 1);
          }
          if (stateName) {
            stateMap.set(stateName, (stateMap.get(stateName) || 0) + 1);
          }
        });

        // Convert to arrays, sort desc, take top 5
        const toSorted = (map: Map<string, number>): ChartItem[] =>
          [...map.entries()]
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        setCountryData(toSorted(countryMap));
        setStateData(toSorted(stateMap));
      } catch (err) {
        console.error("[QuizChart] error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (quizId) fetchLocationData();
  }, [quizId]);

  const renderChart = (data: ChartItem[]) => {
    if (data.length === 0) {
      return (
        <div className="flex h-[200px] items-center justify-center text-sm text-zinc-400">
          No data available
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={Math.max(data.length * 50, 150)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="2 2" />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            width={100}
          />
          <Tooltip
            cursor={{ opacity: 0.1 }}
            contentStyle={{
              borderRadius: "10px",
              border: "none",
            }}
          />
          <Bar dataKey="value" fill="orange" radius={[0, 8, 8, 0]}>
            <LabelList
              dataKey="value"
              position="right"
              style={{ fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="">
        <h1 className="mb-6 text-2xl font-bold">Chart Lokasi</h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardContent className="flex h-[250px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <h1 className="mb-6 text-2xl font-bold">Chart Lokasi</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Negara */}
        <Card>
          <CardHeader>
            <CardTitle>🌍 Negara</CardTitle>
          </CardHeader>
          <CardContent>{renderChart(countryData)}</CardContent>
        </Card>

        {/* Provinsi */}
        <Card>
          <CardHeader>
            <CardTitle>📍 Provinsi</CardTitle>
          </CardHeader>
          <CardContent>{renderChart(stateData)}</CardContent>
        </Card>
      </div>
    </div>
  );
}