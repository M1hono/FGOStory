<script setup lang="ts">
import {
    ref,
    computed,
    watch,
    onMounted,
    onUpdated,
    onBeforeUpdate,
    nextTick,
} from "vue";
import { BillManager } from "./billManager";
import type { Bill } from "./bill";
import { useSafeI18n } from "../../../utils/i18n/locale";
import { getDefaultCurrency } from "../../../config/project-config";

const props = defineProps<{
    bills: Bill[] | (() => Promise<Bill[]>);
    currency?: string;
}>();

const { t } = useSafeI18n("bills-component", {
    available: "Available: {amount}",
    income: "Income: {amount}",
    outlay: "Outlay: {amount}",
    operator: "Operator: {name}",
    incomeSource: "Income Source",
    outlayTarget: "Outlay Target",
    transactionContent: "Transaction Content",
    empty: "No bill data available.",
    loading: "Processing bills...",
});

const componentId = `bills-${Math.random().toString(36).substring(2, 9)}`;
const manager = ref<BillManager | null>(null);
const isLoading = ref(true);
const summaryDisplayCurrency = ref(props.currency || getDefaultCurrency());
const availableCurrencies = ref<string[]>([
    "CNY",
    "USD",
    "EUR",
    "JPY",
    "GBP",
]);

const descriptionRowRefs = ref<HTMLElement[]>([]);

onBeforeUpdate(() => {
    descriptionRowRefs.value = [];
});

onUpdated(() => {
    nextTick(() => {
        if (typeof document !== "undefined") {
            const container = document.getElementById(componentId);
            if (container) {
                const allDetailRows =
                    container.querySelectorAll(".detail-row");
                allDetailRows.forEach((row) => {
                    const textEl =
                        row.querySelector<HTMLElement>(".detail-text");
                    if (textEl) {
                        const style = getComputedStyle(textEl);
                        const lineHeight = parseFloat(style.lineHeight);
                        if (textEl.scrollHeight > lineHeight + 3) {
                            row.classList.add("multiline");
                        } else {
                            row.classList.remove("multiline");
                        }
                    }
                });
            }
        }
    });
});

async function fetchAvailableCurrencies() {
    try {
        const response = await fetch(
            "https://api.frankfurter.app/currencies"
        );
        if (!response.ok) throw new Error("Failed to fetch currencies");
        const data = await response.json();
        const currencyCodes = Object.keys(data);
        const preferred = ["CNY", "USD", "EUR", "JPY", "GBP"];
        const other = currencyCodes
            .filter((c) => !preferred.includes(c))
            .sort();
        availableCurrencies.value = [...preferred, ...other];
    } catch (error) {
        console.error(
            "Could not fetch available currencies, using fallback list.",
            error
        );
    }
}

const initialize = async () => {
    isLoading.value = true;
    let sourceBills: Bill[] = [];
    
    if (typeof props.bills === "function") {
        try {
            sourceBills = await props.bills();
        } catch (e) {
            console.error("Failed to load bills from function:", e);
        }
    } else {
        sourceBills = props.bills || [];
    }

    const defaultTargetUnit = props.currency || getDefaultCurrency();
    const processedBills = await BillManager.processBills(
        sourceBills,
        defaultTargetUnit
    );
    manager.value = new BillManager(processedBills);
    isLoading.value = false;
};

const summaryInPrimaryCurrency = computed(() => {
    if (!manager.value)
        return { available: 0, totalIncome: 0, totalOutlay: 0 };
    return manager.value.getSummary();
});

const summaryRate = ref(1);
watch(
    summaryDisplayCurrency,
    async (newCurrency) => {
        const primary = props.currency || getDefaultCurrency();
        if (newCurrency === primary) {
            summaryRate.value = 1;
            return;
        }
        try {
            const response = await fetch(
                `https://api.frankfurter.app/latest?from=${primary}&to=${newCurrency}`
            );
            const data = await response.json();
            summaryRate.value = data.rates[newCurrency] || 1;
        } catch {
            summaryRate.value = 1;
        }
    },
    { immediate: true }
);

const convertedSummary = computed(() => {
    const symbol = BillManager.resolveCurrencySymbol(
        summaryDisplayCurrency.value
    );
    return {
        available: BillManager.format(
            summaryInPrimaryCurrency.value.available * summaryRate.value,
            symbol
        ),
        totalIncome: BillManager.format(
            summaryInPrimaryCurrency.value.totalIncome * summaryRate.value,
            symbol
        ),
        totalOutlay: BillManager.format(
            summaryInPrimaryCurrency.value.totalOutlay * summaryRate.value,
            symbol
        ),
    };
});

onMounted(() => {
    initialize();
    fetchAvailableCurrencies();
});
watch(() => [props.bills, props.currency], initialize, { deep: true });
</script>

<template>
    <div class="bills-root">
        <div class="summary-section">
            <div class="summary-values">
                <div class="summary-item available">
                    {{
                        t.available.replace(
                            "{amount}",
                            convertedSummary.available
                        )
                    }}
                </div>
                <div class="summary-item income">
                    {{
                        t.income.replace(
                            "{amount}",
                            convertedSummary.totalIncome
                        )
                    }}
                </div>
                <div class="summary-item outlay">
                    {{
                        t.outlay.replace(
                            "{amount}",
                            convertedSummary.totalOutlay
                        )
                    }}
                </div>
            </div>
            <div class="currency-switcher-wrapper">
                <select
                    v-model="summaryDisplayCurrency"
                    class="currency-select"
                >
                    <option
                        v-for="c in availableCurrencies"
                        :key="c"
                        :value="c"
                    >
                        {{ c }}
                    </option>
                </select>
            </div>
        </div>

        <div v-if="isLoading" class="state-placeholder">{{ t.loading }}</div>
        <div
            v-else-if="!manager || manager.getBills().length === 0"
            class="state-placeholder"
        >
            {{ t.empty }}
        </div>

        <div v-else class="bill-list-container" :id="componentId">
            <div
                v-for="(bill, index) in manager.getBills()"
                :key="index"
                class="collapse-container"
            >
                <input
                    type="checkbox"
                    :id="`${componentId}-${index}`"
                    class="collapse-toggle"
                />
                <label :for="`${componentId}-${index}`" class="collapse-header">
                    <div class="icon-wrapper">
                        <div :class="['icon-circle', bill.type]">
                            {{
                                BillManager.resolveCurrencySymbol(
                                    bill["target-unit"]!
                                )
                            }}
                        </div>
                    </div>
                    <div class="info-wrapper">
                        <div class="info-primary">{{ bill.date }}</div>
                        <div class="info-secondary">
                            {{ t.operator.replace("{name}", bill.operator) }}
                        </div>
                    </div>
                    <div class="amount-wrapper">
                        <div
                            v-if="
                                bill['original-unit'] && bill['original-amount']
                            "
                            class="original-amount"
                        >
                            {{
                                BillManager.format(
                                    bill["original-amount"],
                                    BillManager.resolveCurrencySymbol(
                                        bill["original-unit"]
                                    )
                                )
                            }}
                        </div>
                        <div class="exchanged-amount">
                            {{
                                BillManager.format(
                                    bill["exchanged-amount"],
                                    BillManager.resolveCurrencySymbol(
                                        bill["target-unit"]!
                                    )
                                )
                            }}
                        </div>
                    </div>
                </label>
                <div class="collapse-content">
                    <div class="detail-row">
                        <span class="detail-badge type">
                            {{
                                bill.type === "income"
                                    ? t.incomeSource
                                    : t.outlayTarget
                            }}
                        </span>
                        <span class="detail-text">{{ bill.target }}</span>
                    </div>
                    <div
                        v-if="bill.description"
                        class="detail-row"
                        :ref="(el) => (descriptionRowRefs[index] = el as HTMLElement)"
                    >
                        <span class="detail-badge description">
                            {{ t.transactionContent }}
                        </span>
                        <span class="detail-text">{{ bill.description }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.bills-root {
    margin: 16px 0;
}

.summary-section {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
    align-items: center;
}
.summary-values {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    flex-grow: 1;
}
@media (max-width: 640px) {
    .summary-section {
        flex-direction: column;
        align-items: stretch;
    }
    .summary-values {
        justify-content: center;
    }
    .currency-switcher-wrapper {
        align-self: center;
    }
}
.summary-item {
    min-width: 120px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 14px;
    text-align: center;
    white-space: nowrap;
    flex-shrink: 0;
}
.available {
    background-color: #e2e2e3;
    color: #333;
}
.income {
    background-color: #008000;
    color: white;
}
.outlay {
    background-color: #dbbe3e;
    color: black;
}

.currency-switcher-wrapper {
    flex-shrink: 0;
}
.currency-select {
    border: 1px solid var(--vp-c-divider);
    background-color: var(--vp-c-bg-soft);
    color: var(--vp-c-text-1);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 14px;
    cursor: pointer;
    transition: border-color 0.2s ease;
    min-width: 80px;
}
.currency-select:hover {
    border-color: var(--vp-c-brand-1);
}

.bill-list-container {
    border: 2px solid #d0d7de;
    border-radius: 20px;
    padding: 8px;
    background-color: #f6f8fa;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.collapse-container {
    background-color: #ffffff;
    border-radius: 12.5px;
    overflow: hidden;
    border: 2px solid #d0d7de;
    transition: all 0.3s ease;
}
.collapse-toggle {
    display: none;
}
.collapse-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 24px 40px 24px 12px;
    cursor: pointer;
    position: relative;
    transition: background-color 0.2s ease;
}
@media (max-width: 640px) {
    .collapse-header {
        flex-wrap: wrap;
        padding: 16px 32px 16px 8px;
        gap: 8px;
    }
    .info-wrapper {
        order: 1;
        flex-basis: 100%;
    }
    .amount-wrapper {
        order: 2;
        margin-top: 8px;
    }
}
.collapse-header::after {
    content: "▲";
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    transition: transform 0.3s ease;
    font-size: 14px;
    color: #656d76;
}
.collapse-toggle:not(:checked) ~ .collapse-header::after {
    transform: translateY(-50%) rotate(180deg);
}

.icon-wrapper {
    flex-shrink: 0;
}
.icon-circle {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
}
.icon-circle.income {
    background-color: #008000;
    color: white;
}
.icon-circle.outlay {
    background-color: #dbbe3e;
    color: black;
}

.info-wrapper {
    flex-grow: 1;
}
.info-primary {
    font-weight: bold;
    color: #1f2328;
    font-size: 18px;
    margin-bottom: 2px;
}
.info-secondary {
    font-size: 15px;
    color: #656d76;
}

.amount-wrapper {
    text-align: right;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}
.original-amount {
    font-size: 15px;
    color: #656d76;
    opacity: 0.75;
    border-right: 1px solid #d0d7de;
    padding-right: 8px;
}
.exchanged-amount {
    font-size: 20px;
    font-weight: 600;
    color: #1f2328;
}

.collapse-content {
    display: none;
    padding: 16px 24px 16px 16px;
    opacity: 0;
    max-height: 0;
    overflow: hidden;
    transition: all 0.3s ease;
    background-color: #ffffff;
}
.collapse-toggle:checked ~ .collapse-content {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 12px;
    align-items: center;
    padding: 16px 24px 16px 16px;
    opacity: 1;
    max-height: 300px;
    animation: slideDown 0.3s ease;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.detail-row {
    display: contents;
}

.detail-row.multiline > .detail-badge,
.detail-row.multiline > .detail-text {
    align-self: start;
}

.detail-row:last-child {
    margin-bottom: 0;
}
@media (max-width: 640px) {
    .collapse-toggle:checked ~ .collapse-content {
        display: flex;
        flex-direction: column;
        gap: 0px;
        align-items: initial;
    }

    .detail-row {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        margin-bottom: 12px;
    }

    .detail-badge {
        min-width: auto !important;
        max-width: none;
        align-self: flex-start;
    }
    .detail-text {
        max-width: 100%;
    }
}
.detail-badge {
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    color: white;
    flex-shrink: 0;
    min-width: 110px;
    max-width: 160px;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.detail-badge.type {
    background-color: #5a867c;
}
.detail-badge.original {
    background-color: #8e6e5e;
}
.detail-badge.description {
    background-color: #915930;
}
.detail-text {
    font-size: 13px;
    color: #656d76;
    line-height: 1.6;
    word-break: break-word;
    font-weight: 500;
    text-align: left;
    transition: text-align 0.2s ease;
}

.detail-row.multiline .detail-text {
    text-align: justify;
}

.state-placeholder {
    padding: 32px;
    text-align: center;
    background-color: #f6f8fa;
    border-radius: 12px;
    color: #656d76;
    margin: 8px 0;
}
</style>
