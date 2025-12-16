/**
 * @fileoverview Type definitions for bill management
 * @module BillTypes
 * @description Defines the core data structures for financial transactions
 */

/**
 * @interface Bill
 * @description Represents a single financial transaction, detailing its nature,
 * amount, and context.
 */
export interface Bill {
    /**
     * @description The date of the transaction in YYYY-MM-DD format.
     * @type {string}
     */
    date: string;

    /**
     * @description The original amount of the transaction in a foreign currency. Optional.
     * @type {number | undefined}
     */
    "original-amount"?: number;

    /**
     * @description The currency of the original amount. Can be a currency symbol (e.g., "$")
     * or a 3-letter currency code (e.g., "USD"). Optional.
     * @type {string | undefined}
     */
    "original-unit"?: string;

    /**
     * @description The final amount of the transaction after any currency exchange,
     * in the project's default currency.
     * @type {number}
     */
    "exchanged-amount": number;

    /**
     * @description The target currency for automatic conversion, overriding the
     * component-level default currency. Optional.
     * @type {string | undefined}
     */
    "target-unit"?: string;

    /**
     * @description The target of the transaction. For income, this is the source
     * (e.g., "Company A"). For an outlay, this is the recipient (e.g., "Service B").
     * @type {string}
     */
    target: string;

    /**
     * @description The person or system that performed the transaction.
     * @type {string}
     */
    operator: string;

    /**
     * @description A detailed description of what the transaction was for.
     * @type {string}
     */
    description: string;

    /**
     * @description The type of the bill, defining whether it's money coming in or going out.
     * @type {'income' | 'outlay'}
     */
    type: "income" | "outlay";
}

/**
 * @interface BillSummary
 * @description A summary of all financial transactions, providing a high-level overview.
 */
export interface BillSummary {
    /**
     * @description The net available balance (total income - total outlay).
     * @type {number}
     */
    available: number;
    /**
     * @description The gross total of all income transactions.
     * @type {number}
     */
    totalIncome: number;
    /**
     * @description The gross total of all outlay transactions.
     * @type {number}
     */
    totalOutlay: number;
}
