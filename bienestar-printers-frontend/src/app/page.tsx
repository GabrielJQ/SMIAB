import { PrinterDetailWidget } from "../components/dashboard/PrinterDetailWidget";
import { PrinterHistoryWidget } from "../components/dashboard/PrinterHistoryWidget";
import { GeneralStatsWidget } from "../components/dashboard/GeneralStatsWidget";

export default function Home() {
  return (
    <div className="flex flex-col h-full gap-6 overflow-hidden">
      {/* Sección Superior (Hero): Estadísticas de Equipo - 55% del espacio */}
      <div className="flex-[1.2] min-h-0 w-full">
        <PrinterHistoryWidget />
      </div>

      {/* Sección Inferior: Cuadrantes de Detalle y Globales - 45% del espacio */}
      <div className="flex-[1] min-h-0 w-full grid grid-cols-2 gap-6">
        {/* Cuadrante Inferior Izquierdo: Consumibles */}
        <div className="min-h-0 min-w-0">
          <PrinterDetailWidget />
        </div>

        {/* Cuadrante Inferior Derecho: Estadísticas Globales */}
        <div className="min-h-0 min-w-0">
          <GeneralStatsWidget />
        </div>
      </div>
    </div>
  );
}
