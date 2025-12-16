/**
 * @fileoverview Smart bill management with automatic currency conversion.
 * @module BillManager
 */

import currency from "currency.js";
import type { Bill, BillSummary } from "./bill";

// A simple cache to store fetched exchange rates for the session.
const exchangeRatesCache = new Map<string, number>();

/**
 * Fetches the exchange rate between two currencies.
 * @param from The source currency code (e.g., "USD").
 * @param to The target currency code (e.g., "CNY").
 * @returns A promise that resolves to the exchange rate.
 */
async function getExchangeRate(from: string, to: string): Promise<number> {
    if (from === to) return 1;
    const cacheKey = `${from}-${to}`;
    if (exchangeRatesCache.has(cacheKey)) {
        return exchangeRatesCache.get(cacheKey)!;
    }
    try {
        // Using the Frankfurter API for real-time exchange rates.
        const response = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
        const data = await response.json();
        const rate = data.rates[to];
        if (!rate) throw new Error(`Rate not found for ${from} to ${to}`);
        exchangeRatesCache.set(cacheKey, rate);
        return rate;
    } catch (error) {
        console.error(`Failed to fetch exchange rate for ${from} to ${to}:`, error);
        // Fallback to a rate of 1 to prevent calculations from failing completely.
        return 1;
    }
}

/**
 * @class BillManager
 * @description Central manager for bill operations with advanced data processing.
 */
export class BillManager {
    private bills: Bill[];

    /**
     * Initializes the manager with a set of ALREADY PROCESSED bills.
     * @param bills - A pre-processed array of bill objects.
     */
    constructor(bills: Bill[] = []) {
        this.bills = [...bills].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }

    /**
     * The core processing engine. Takes raw bill data and returns fully processed bills
     * with all currency conversions handled.
     * @param rawBills - The raw array of bills from props or a file.
     * @param defaultTargetUnit - The default currency to convert to (e.g., "CNY").
     * @returns A promise that resolves to a new array of processed bills.
     * @static
     */
    public static async processBills(rawBills: Bill[], defaultTargetUnit: string): Promise<Bill[]> {
        const processed: Bill[] = [];
        for (const bill of rawBills) {
            let finalAmount = bill['exchanged-amount'];
            const targetUnit = bill['target-unit'] || defaultTargetUnit;

            // If exchanged-amount is missing, perform automatic conversion.
            if (finalAmount === undefined && bill['original-amount'] && bill['original-unit']) {
                const rate = await getExchangeRate(bill['original-unit'], targetUnit);
                finalAmount = currency(bill['original-amount']).multiply(rate).value;
            }

            processed.push({
                ...bill,
                'exchanged-amount': finalAmount ?? 0, // Ensure it's not undefined
                'target-unit': targetUnit // Ensure target-unit is set
            });
        }
        return processed;
    }

    getBills(): Bill[] {
        return this.bills;
    }

    getIncomes(): currency {
        return this.bills.reduce((sum, bill) => 
            bill.type === "income" ? sum.add(bill["exchanged-amount"]) : sum, 
        currency(0));
    }

    getOutlays(): currency {
        return this.bills.reduce((sum, bill) =>
            bill.type === "outlay" ? sum.add(bill["exchanged-amount"]) : sum,
        currency(0));
    }
    
    getAvailable(): currency {
        return this.getIncomes().subtract(this.getOutlays());
    }

    getSummary(): BillSummary {
        const totalIncome = this.getIncomes();
        const totalOutlay = this.getOutlays();
        return {
            available: totalIncome.subtract(totalOutlay).value,
            totalIncome: totalIncome.value,
            totalOutlay: totalOutlay.value,
        };
    }
    
    /**
     * Resolves a currency unit (code) to its corresponding symbol.
     * @param unit - The currency code (e.g., "USD").
     * @returns The currency symbol (e.g., "$").
     * @static
     */
    static resolveCurrencySymbol(unit: string): string {
        if (!unit) return "";
        try {
            const parts = new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: unit,
                currencyDisplay: 'narrowSymbol'
            }).formatToParts(1);
            return parts.find(part => part.type === 'currency')?.value || unit;
        } catch (e) {
            console.warn(`Could not resolve symbol for currency code: ${unit}.`);
            return unit;
        }
    }

    /**
     * Formats a numeric amount into a currency string with the given symbol.
     * @param amount - The amount to format.
     * @param symbol - The currency symbol to prepend.
     * @returns The formatted string (e.g., "$1,234.56").
     * @static
     */
    static format(amount: number | currency, symbol: string): string {
        return currency(amount, { symbol, pattern: `!#` }).format();
    }
}
