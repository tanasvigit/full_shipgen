import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function PageHeader({ overline, title, description, actions, breadcrumbs }) {
    return (
        <div className="relative border-b border-black/[0.06] bg-[#F5F6F8] overflow-hidden" data-testid="page-header">
            {/* Subtle backdrop */}
            <div className="absolute inset-0 grid-bg-fine opacity-[0.6] pointer-events-none" />
            <div className="absolute -top-20 -left-20 h-56 w-56 rounded-full bg-[#0066FF]/[0.06] blur-[80px] pointer-events-none" />

            <div className="relative px-7 py-7">
                {breadcrumbs && (
                    <nav className="flex items-center gap-1.5 mb-4" data-testid="breadcrumbs">
                        {breadcrumbs.map((b, i) => (
                            <span key={i} className="flex items-center gap-1.5">
                                {b.to ? (
                                    <Link to={b.to} className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#4B5563] hover:text-[#0A0E1A] transition-colors">{b.label}</Link>
                                ) : (
                                    <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#0A0E1A]">{b.label}</span>
                                )}
                                {i < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3 text-[#4B5563]" strokeWidth={2} />}
                            </span>
                        ))}
                    </nav>
                )}
                <div className="flex items-start justify-between gap-6 flex-wrap">
                    <div className="min-w-0 flex-1">
                        {overline && (
                            <div className="flex items-center gap-2 mb-2">
                                <span className="h-1 w-6 rounded-full bg-gradient-to-r from-[#0066FF] to-transparent" />
                                <span className="overline">{overline}</span>
                            </div>
                        )}
                        <h1 className="font-display text-[34px] sm:text-[40px] font-black tracking-[-0.045em] leading-[1.02] text-[#0A0E1A]">{title}</h1>
                        {description && (
                            <p className="text-[14px] text-[#374151] mt-2.5 max-w-2xl leading-relaxed">{description}</p>
                        )}
                    </div>
                    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
                </div>
            </div>
        </div>
    );
}
