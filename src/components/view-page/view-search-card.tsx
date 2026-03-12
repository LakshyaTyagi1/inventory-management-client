import { SearchIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ViewSearchCard({
  title,
  description,
  placeholder,
  query,
  onQueryChange,
  resultCount,
  totalCount,
  noun,
}: {
  title: string;
  description: string;
  placeholder: string;
  query: string;
  onQueryChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
  noun: string;
}) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Showing {resultCount} of {totalCount} {noun}
          {totalCount === 1 ? "" : "s"}.
        </p>
      </CardContent>
    </Card>
  );
}
