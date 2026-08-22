export function rentalDays(startDate: Date, endDate: Date) {
  return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000));
}

export function rentalTotalAmount(startDate: Date, endDate: Date, dailyRateGnf: number) {
  return rentalDays(startDate, endDate) * dailyRateGnf;
}
