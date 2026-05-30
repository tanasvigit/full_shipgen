import PageHeader from "@/components/common/PageHeader";
import { Download, LineChart, BarChart3, ArrowRightLeft, Wallet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ResponsiveContainer, LineChart as RLineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const reports = [
    { id: "pnl", title: "Profit & Loss", description: "Revenue minus expenses by month", icon: LineChart, period: "Last 12 months" },
    { id: "bs", title: "Balance Sheet", description: "Assets, liabilities and equity snapshot", icon: BarChart3, period: "Current" },
    { id: "cf", title: "Cash Flow", description: "Inflow and outflow by week", icon: ArrowRightLeft, period: "Last 30 days" },
    { id: "ar", title: "A/R Aging", description: "Outstanding receivables by bucket", icon: Wallet, period: "Current" },
    { id: "tb", title: "Trial Balance", description: "Debits and credits by account", icon: FileText, period: "Current period" },
    { id: "ws", title: "Wallet Summary", description: "All wallet balances and movements", icon: Wallet, period: "Current" },
];

const pnlSeries = [
    { m: "Mar", revenue: 124, expense: 78 }, { m: "Apr", revenue: 138, expense: 82 },
    { m: "May", revenue: 152, expense: 88 }, { m: "Jun", revenue: 168, expense: 94 },
    { m: "Jul", revenue: 184, expense: 102 }, { m: "Aug", revenue: 198, expense: 108 },
    { m: "Sep", revenue: 212, expense: 118 }, { m: "Oct", revenue: 224, expense: 126 },
    { m: "Nov", revenue: 238, expense: 132 }, { m: "Dec", revenue: 268, expense: 142 },
    { m: "Jan", revenue: 254, expense: 138 }, { m: "Feb", revenue: 284, expense: 148 },
];

export default function LedgerReports() {
    return (
        <div data-testid="ledger-reports-page">
            <PageHeader
                breadcrumbs={[{ label: "Ledger", to: "/ledger" }, { label: "Reports" }]}
                overline="Insights"
                title="Financial Reports"
                description="Standardized statements you can run, download or schedule."
            />
            <div className="p-6 space-y-6">
                <div className="bg-white border border-black/[0.08] rounded-md overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-black/[0.08]">
                        <div>
                            <div className="overline">Profit & Loss · 12 months</div>
                            <div className="font-display font-bold text-lg tracking-tight">Revenue vs. Expense</div>
                        </div>
                        <Button variant="outline" onClick={() => toast.success("Report exported (CSV)")} className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] text-[#1F2937]" data-testid="reports-export">
                            <Download className="h-3.5 w-3.5 mr-1.5" /> Export
                        </Button>
                    </div>
                    <div className="h-[340px] p-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <RLineChart data={pnlSeries} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                                <CartesianGrid stroke="#27272a" vertical={false} />
                                <XAxis dataKey="m" stroke="#52525b" tickLine={false} axisLine={{ stroke: "#27272a" }} tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                                <YAxis stroke="#52525b" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 6, fontSize: 12 }} cursor={{ stroke: "#3B82F6", strokeWidth: 1 }} />
                                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                                <Line type="monotone" dataKey="expense" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                            </RLineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {reports.map((r) => {
                        const Icon = r.icon;
                        return (
                            <div key={r.id} className="bg-white border border-black/[0.08] hover:border-black/[0.14] rounded-md p-5 transition-colors" data-testid={`report-card-${r.id}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="h-10 w-10 bg-blue-500/10 border border-blue-500/30 grid place-items-center rounded-sm">
                                        <Icon className="h-5 w-5 text-[#0066FF]" strokeWidth={1.5} />
                                    </div>
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#4B5563]">{r.period}</span>
                                </div>
                                <div className="font-display font-bold text-lg tracking-tight">{r.title}</div>
                                <p className="text-sm text-[#374151] mt-1">{r.description}</p>
                                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-black/[0.08]">
                                    <Button onClick={() => toast.success(`${r.title} generated`)} className="bg-blue-600 hover:bg-blue-700 h-8 text-xs flex-1" data-testid={`report-run-${r.id}`}>
                                        Run report
                                    </Button>
                                    <Button onClick={() => toast.success("Downloaded PDF")} variant="outline" className="bg-transparent border-black/[0.08] hover:bg-[#F1F2F5] h-8">
                                        <Download className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
