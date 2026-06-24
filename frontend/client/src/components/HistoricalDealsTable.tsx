import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DealFormData } from "./DealInputForm";
import { getHistoricalDeals, HistoricalDealRaw } from "@/lib/api";

interface HistoricalDeal {
  id: number;
  dealName: string;
  value: number;
  premium: number;
  paymentType: "cash" | "stock" | "mixed";
  outcome: "success" | "failed" | "pending";
}

interface HistoricalDealsTableProps {
  dealFormData: DealFormData | null;
}

export function HistoricalDealsTable({ dealFormData }: HistoricalDealsTableProps) {
  const [rawDeals, setRawDeals] = useState<HistoricalDealRaw[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getHistoricalDeals()
      .then((data) => {
        setRawDeals(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load historical deals:", err);
        setIsLoading(false);
      });
  }, []);

  // Map live raw deals to UI HistoricalDeal schema
  const mappedHistoricalDeals = useMemo(() => {
    return rawDeals.map((deal, idx) => {
      // payment_type can sometimes be different case, normalize it
      const payType = (deal.payment_type?.toLowerCase() || "cash") as "cash" | "stock" | "mixed";
      
      return {
        id: idx,
        dealName: `${deal.acquirer} - ${deal.target}`,
        value: Math.round((deal.deal_value_billion || 0) * 1000), // convert to millions
        premium: deal.premium !== undefined && deal.premium !== null ? deal.premium : 30,
        paymentType: payType,
        outcome: (deal.success === 1 ? "success" : "failed") as "success" | "failed" | "pending",
      };
    });
  }, [rawDeals]);

  // Calculate similarity between current deal and historical deals
  const calculateSimilarity = (currentDeal: DealFormData, historicalDeal: HistoricalDeal): number => {
    let similarity = 0;
    // Payment type match (25 points)
    if (currentDeal.paymentType === historicalDeal.paymentType) similarity += 25;
    // Deal value similarity (20 points)
    const valueDiff = Math.abs(currentDeal.dealValue - historicalDeal.value);
    const maxValue = Math.max(currentDeal.dealValue, historicalDeal.value);
    const valueSimilarity = Math.max(0, 20 * (1 - valueDiff / (maxValue || 1)));
    similarity += valueSimilarity;
    // Premium similarity (20 points)
    const premiumDiff = Math.abs(currentDeal.premium - historicalDeal.premium);
    const premiumSimilarity = Math.max(0, 20 * (1 - premiumDiff / 100));
    similarity += premiumSimilarity;
    return similarity;
  };

  // Get the top 5 most similar deals
  const topDeals = useMemo(() => {
    if (mappedHistoricalDeals.length === 0) return [];
    if (!dealFormData) return mappedHistoricalDeals.slice(0, 5);
    
    const scored = mappedHistoricalDeals.map(deal => ({
      deal,
      similarity: calculateSimilarity(dealFormData, deal),
    }));
    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(s => s.deal);
  }, [dealFormData, mappedHistoricalDeals]);

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader>
        <CardTitle>Historical Comparables</CardTitle>
        <CardDescription>
          5 most similar historical M&A deals by deal structure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal Name</TableHead>
                <TableHead className="text-right">Value ($M)</TableHead>
                <TableHead className="text-right">Premium %</TableHead>
                <TableHead>Payment Type</TableHead>
                <TableHead>Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">{deal.dealName}</TableCell>
                  <TableCell className="text-right">${deal.value.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{deal.premium}%</TableCell>
                  <TableCell>
                    <span className="capitalize text-sm">
                      {deal.paymentType === "mixed" ? "Cash + Stock" : deal.paymentType}
                    </span>
                  </TableCell>
                  <TableCell>{getOutcomeBadge(deal.outcome)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Similarity is calculated based on deal size, premium, payment structure, and cross-border/same-industry flags.
        </p>
      </CardContent>
    </Card>
  );
}
