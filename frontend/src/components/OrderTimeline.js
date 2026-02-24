import { Check, Package, Truck, Home } from "lucide-react";
import "./timeline.css";

const STEPS = [
    { key: "Placed", label: "Placed", icon: Package },
    { key: "Processing", label: "Processing", icon: Package },
    { key: "Shipped", label: "In transit", icon: Truck },
    { key: "Delivered", label: "Delivered", icon: Home }
];

export default function OrderTimeline({ status }) {
    const idx = STEPS.findIndex(s => s.key === status);
    const current = idx === -1 ? 0 : idx;

    return (
        <div className="timeline-card">
            <div className="timeline-header">
                <span className="timeline-title">Delivery Status</span>
                <span className={`status-pill ${status?.toLowerCase()}`}>
                    {status}
                </span>
            </div>

            <div className="timeline-row">
                {STEPS.map((step, i) => {
                    const Icon = step.icon;
                    const active = i <= current;
                    const done = i < current;

                    return (
                        <div key={step.key} className="timeline-step">
                            <div className={`circle ${active ? "active" : ""}`}>
                                {done ? <Check size={14} /> : <Icon size={14} />}
                            </div>

                            {i !== STEPS.length - 1 && (
                                <div className={`line ${i < current ? "active" : ""}`} />
                            )}

                            <div className={`label ${active ? "active" : ""}`}>
                                {step.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}