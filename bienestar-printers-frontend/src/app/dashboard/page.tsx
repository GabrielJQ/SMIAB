"use client";

import { UnitStatusWidget } from "@/components/dashboard/UnitStatusWidget";
import { GeneralStatsWidget } from "@/components/dashboard/GeneralStatsWidget";
import { TonerUnitStatsWidget } from "@/components/toner/TonerUnitStatsWidget";
import { TopConsumersWidget } from "@/components/dashboard/TopConsumersWidget";
import { AttentionPrintersWidget } from "@/components/dashboard/AttentionPrintersWidget";

export default function DashboardPage() {
    return (
        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0 min-w-0">
            {/* 🛡️ BANCO DE TRABAJO (IZQUIERDA) - Estado y Operación */}
            <div className="lg:w-[350px] xl:w-[400px] flex flex-col gap-8 shrink-0">
                {/* Resumen Ejecutivo */}
                <div className="flex-none">
                    <UnitStatusWidget />
                </div>

                {/* Centro de Atención Inmediata (Alertas) */}
                <div className="h-fit">
                    <AttentionPrintersWidget />
                </div>
            </div>

            {/* 📊 LABORATORIO DE DATOS (DERECHA) - Gráficas y Análisis */}
            <div className="flex-1 min-w-0 flex flex-col gap-8">
                {/* Foco Principal: Tendencia Global */}
                <div className="flex-none">
                    <GeneralStatsWidget />
                </div>

                {/* Foco Secundario: Análisis de Insumos y Ranking */}
                <div className="flex flex-col xl:flex-row gap-8 flex-1 min-h-0">
                    {/* Estadística Anual de Toners */}
                    <div className="xl:flex-[1.5] min-h-[400px]">
                        <TonerUnitStatsWidget />
                    </div>

                    {/* Top Consumidores del Mes Anterior */}
                    <div className="xl:flex-1 min-h-[400px]">
                        <TopConsumersWidget />
                    </div>
                </div>
            </div>
        </div>
    );
}
