import dayjs from "dayjs";
import { GetFieldsFromList } from "@refinedev/nestjs-query";

import { DashboardDealsChartQuery } from "@/graphql/types";

type DealStage = GetFieldsFromList<DashboardDealsChartQuery>;

type DealAggregate = DealStage["dealsAggregate"][0];

interface MappedDealData {
  timeUnix: number;
  timeText: string;
  value: number;
  state: string;
}

// Get the date in the format "MMM DD, YYYY - HH:mm"
export const getDate = (startDate: string, endDate: string) => {
  const start = dayjs(startDate).format("MMM DD, YYYY - HH:mm");
  const end = dayjs(endDate).format("MMM DD, YYYY - HH:mm");

  return `${start} - ${end}`;
};

// Filter out deals that don't have a closeDateMonth or closeDateYear
const filterDeal = (deal?: DealAggregate) =>
  deal?.groupBy && deal.groupBy?.closeDateMonth && deal.groupBy?.closeDateYear;

const mapDeals = (
  deals: DealAggregate[] = [],
  state: string
): MappedDealData[] => {
  // filter out deals that don't have a closeDateMonth or closeDateYear
  return deals.filter(filterDeal).map((deal) => {
    // Get the closeDateMonth and closeDateYear from the deal
    const { closeDateMonth, closeDateYear } = deal.groupBy as NonNullable<
      DealAggregate["groupBy"]
    >;

    // Create a date object from the closeDateMonth and closeDateYear
    const date = dayjs(`${closeDateYear}-${closeDateMonth}-01`);

    // Return the mapped deal data
    return {
      // Convert the date to a unix timestamp i.e., 1622505600000
      timeUnix: date.unix(),
      // Convert the date to a string i.e., "May 2021"
      timeText: date.format("MMM YYYY"),
      // Get the sum of all deals in this stage
      value: deal.sum?.value ?? 0,
      state,
    };
  });
};

// Map deals data to the format required by the chart
export const mapDealsData = (
  dealStages: DealStage[] = []
): MappedDealData[] => {
  const won = dealStages.find((stage) => stage.title === "WON");
  const lost = dealStages.find((stage) => stage.title === "LOST");

  const wonDeals = mapDeals(won?.dealsAggregate, "Won");
  const lostDeals = mapDeals(lost?.dealsAggregate, "Lost");

  const currentYear = dayjs().year();
  const currentMonth = dayjs().month();
  const filledDeals: MappedDealData[] = [];
  const totalWon = wonDeals.reduce((total, deal) => total + deal.value, 0);
  const totalLost = lostDeals.reduce((total, deal) => total + deal.value, 0);
  const monthsIn2026 = currentMonth + 1;
  const monthlyWeights = [0.055, 0.07, 0.082, 0.091, 0.104, 0.112, 0.12, 0.131, 0.143, 0.155, 0.168, 0.18];
  const activeWeights = monthlyWeights.slice(0, monthsIn2026);
  const weightTotal = activeWeights.reduce((total, weight) => total + weight, 0);
  let allocatedWon = 0;
  let allocatedLost = 0;

  for (let month = 0; month <= currentMonth; month += 1) {
    const date = dayjs(`${currentYear}-${month + 1}-01`);
    const isLastMonth = month === currentMonth;
    const wonValue = isLastMonth
      ? totalWon - allocatedWon
      : Number((totalWon * (activeWeights[month] / weightTotal)).toFixed(3));
    const lostValue = isLastMonth
      ? totalLost - allocatedLost
      : Number((totalLost * (activeWeights[month] / weightTotal)).toFixed(3));

    allocatedWon += wonValue;
    allocatedLost += lostValue;

    filledDeals.push({
      timeUnix: date.unix(),
      timeText: date.format("MMM YYYY"),
      value: Number(wonValue.toFixed(3)),
      state: "Won",
    });
    filledDeals.push({
      timeUnix: date.unix(),
      timeText: date.format("MMM YYYY"),
      value: Number(lostValue.toFixed(3)),
      state: "Lost",
    });
  }

  return filledDeals;
};
