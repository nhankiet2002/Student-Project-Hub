import { useGetTopicTrends } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function Trends() {
  const { data: trends, isLoading } = useGetTopicTrends();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Xu hướng công nghệ</h1>
        <p className="text-muted-foreground mt-1">Khám phá các chủ đề và công nghệ đang được quan tâm nhất hiện nay.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5" />
            Biểu đồ xu hướng
          </CardTitle>
          <CardDescription>Top 10 chủ đề có điểm xu hướng cao nhất</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends?.slice(0, 10) || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="title" tick={{ fontSize: 12 }} tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val} stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)' }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {trends?.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
        ) : (
          trends?.map((trend, i) => (
            <Card key={trend.id} className="relative overflow-hidden group">
              <div className={`absolute top-0 left-0 w-1 h-full bg-chart-${(i % 5) + 1}`} />
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2">{trend.source}</Badge>
                    <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {trend.url ? (
                        <a href={trend.url} target="_blank" rel="noreferrer" className="hover:underline">{trend.title}</a>
                      ) : (
                        trend.title
                      )}
                    </h3>
                  </div>
                  <div className="flex flex-col items-end ml-4">
                    <span className="text-2xl font-bold flex items-center text-primary">
                      {Math.round(trend.score)}
                      <TrendingUp className="w-4 h-4 ml-1 text-green-500" />
                    </span>
                    <span className="text-xs text-muted-foreground">Điểm xu hướng</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {trend.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}