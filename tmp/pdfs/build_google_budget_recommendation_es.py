from pathlib import Path

source_path = Path(__file__).with_name("build_google_budget_recommendation.py")
source = source_path.read_text(encoding="utf-8")

replacements = {
    "google-ads-budget-recommendation.pdf": "recomendacion-presupuesto-google-ads.pdf",
    "Google Ads Budget Recommendation - Tires SOS Rescue": "Recomendacion de presupuesto de Google Ads - Tires SOS Rescue",
    "TIRES SOS Rescue | Google Ads recommendation review": "TIRES SOS Rescue | Revision de recomendacion de Google Ads",
    "Page {doc.page}": "Pagina {doc.page}",
    "GOOGLE ADS RECOMMENDATION": "RECOMENDACION DE GOOGLE ADS",
    "Prepared August 12, 2026": "Preparado el 12 de agosto de 2026",
    "Budget Increase Proposal": "Propuesta de inversion publicitaria",
    "A presentation-ready summary of Google's current recommendation for the active Tires SOS Performance Max campaign. This document records the proposal only; no budget or bid changes were applied.": "Resumen listo para presentar de la recomendacion actual de Google para la campaña activa Performance Max de Tires SOS. Este documento solo presenta la propuesta; no se aplicaron cambios al presupuesto ni a las ofertas.",
    "Google recommends increasing the daily budget from $9.50 to $17.00.": "Google recomienda aumentar el presupuesto diario de $9.50 a $17.00.",
    "Google projects 47% more weekly conversions, with a 22% increase in weekly cost per acquisition.": "Google proyecta 47% mas conversiones semanales, con un aumento de 22% en el costo por adquisicion semanal.",
    "CURRENT DAILY BUDGET": "PRESUPUESTO DIARIO ACTUAL",
    "GOOGLE RECOMMENDED": "RECOMENDADO POR GOOGLE",
    "PROJECTED WEEKLY CONVERSIONS": "CONVERSIONES SEMANALES PROYECTADAS",
    "PROJECTED WEEKLY CPA": "CPA SEMANAL PROYECTADO",
    "Current campaign snapshot": "Resumen de la campaña actual",
    "Campaign": "Campaña",
    "Reporting window": "Periodo del informe",
    "July 16 - August 11, 2026 (last 30 days shown in Google Ads)": "16 de julio - 11 de agosto de 2026 (ultimos 30 dias mostrados en Google Ads)",
    "Status / strategy": "Estado / estrategia",
    "Enabled | Performance Max | Maximize conversions": "Habilitada | Performance Max | Maximizar conversiones",
    "Performance": "Rendimiento",
    "23 conversions | 224 clicks | 5,777 impressions | 3.88% CTR": "23 conversiones | 224 clics | 5,777 impresiones | CTR de 3.88%",
    "Efficiency": "Eficiencia",
    "$151.15 spend | $6.57 cost per conversion | 9.66% conversion rate": "$151.15 invertidos | $6.57 por conversion | tasa de conversion de 9.66%",
    "Optimization score": "Nivel de optimizacion",
    "89.3%; Google says applying this budget recommendation would add 10.7 percentage points": "89.3%; Google indica que aplicar esta recomendacion agregaria 10.7 puntos porcentuales",
    "Financial impact": "Impacto financiero",
    "ADDITIONAL DAILY CAPACITY": "CAPACIDAD DIARIA ADICIONAL",
    "ADDITIONAL WEEKLY CAPACITY": "CAPACIDAD SEMANAL ADICIONAL",
    "APPROX. ADDITIONAL 30.4-DAY MONTH": "ADICIONAL MENSUAL APROX. (30.4 DIAS)",
    "BUDGET INCREASE": "AUMENTO DE PRESUPUESTO",
    "Budgets are spending limits, not guaranteed spend. The projections are Google simulations and are not promises of future results. Actual performance can vary with demand, competition, conversion tracking, and auction conditions.": "Los presupuestos son limites de gasto, no gasto garantizado. Las proyecciones son simulaciones de Google y no garantizan resultados futuros. El rendimiento real puede variar segun la demanda, la competencia, la medicion de conversiones y las condiciones de la subasta.",
    "Decision framework": "Resumen para decision del propietario",
    "OPTION": "OPCION",
    "WHEN IT FITS": "CUANDO CONVIENE",
    "CONTROL": "CONTROL",
    "Approve Google's recommendation": "Aprobar la recomendacion de Google",
    "When the business can accept a higher CPA in exchange for more lead volume.": "Cuando el negocio puede aceptar un CPA mayor a cambio de mas clientes potenciales.",
    "Move to $17/day and review after 14 days.": "Subir a $17/dia y revisar despues de 14 dias.",
    "Run a controlled test": "Realizar una prueba controlada",
    "When management wants evidence before committing to the full increase.": "Cuando el propietario desea evidencia antes de aprobar el aumento completo.",
    "Test $13/day for 14 days, then compare conversion volume and CPA.": "Probar $13/dia durante 14 dias y comparar conversiones y CPA.",
    "Keep current budget": "Mantener el presupuesto actual",
    "When protecting efficiency and cash flow matters more than incremental volume.": "Cuando proteger la eficiencia y el flujo de efectivo importa mas que el volumen adicional.",
    "Remain at $9.50/day; no account change required.": "Mantener $9.50/dia; no se requiere ningun cambio.",
    "Recommended management approach:": "Recomendacion para el propietario:",
    "Treat Google's $17/day figure as a growth proposal, not an automatic optimization. If added lead capacity can be handled operationally, approve a time-boxed test with a pre-set CPA review threshold. Otherwise, keep the current $9.50/day budget.": "Considerar los $17/dia de Google como una propuesta de crecimiento, no como una optimizacion automatica. Si el negocio puede atender mas clientes potenciales, aprobar una prueba limitada con un umbral de revision de CPA. De lo contrario, mantener $9.50/dia.",
    "Suggested test guardrails": "Controles sugeridos para la prueba",
    "Test length": "Duracion",
    "14 days after the budget change, with no additional bidding changes during the test.": "14 dias despues del cambio de presupuesto, sin cambios adicionales de ofertas durante la prueba.",
    "Spend ceiling": "Limite de gasto",
    "$17.00 per day for the active campaign; do not apply the recommendation to the paused campaign.": "$17.00 diarios para la campaña activa; no aplicar la recomendacion a la campaña pausada.",
    "Efficiency checkpoint": "Control de eficiencia",
    "Review if cost per conversion materially exceeds about $8.02, the current $6.57 CPA plus Google's projected 22% increase.": "Revisar si el costo por conversion supera considerablemente unos $8.02: el CPA actual de $6.57 mas el aumento de 22% proyectado por Google.",
    "Volume checkpoint": "Control de volumen",
    "Confirm the shop can answer and service the additional calls and lead forms generated by the campaign.": "Confirmar que el taller puede responder y atender las llamadas y formularios adicionales generados por la campaña.",
    "Management decision": "Decision del propietario",
    "[ ] Approve $17/day": "[ ] Aprobar $17/dia",
    "[ ] Approve controlled $13/day test": "[ ] Aprobar prueba de $13/dia",
    "[ ] Keep $9.50/day": "[ ] Mantener $9.50/dia",
    "Decision owner:": "Aprobado por:",
    "Date:": "Fecha:",
    "Review date:": "Fecha de revision:",
    "Source: Google Ads Recommendations and Campaigns views for the Tires SOS Rescue account, accessed August 12, 2026. Figures reflect Google's interface and simulation at the time of review. Budget recommendation was not applied.": "Fuente: vistas Recomendaciones y Campañas de Google Ads para la cuenta de Tires SOS Rescue, consultadas el 12 de agosto de 2026. Las cifras reflejan la interfaz y simulacion de Google al momento de la revision. La recomendacion de presupuesto no fue aplicada.",
}

for english, spanish in replacements.items():
    source = source.replace(english, spanish)

source = source.replace(
    "Source: Google Ads Recommendations and Campañas views for the Tires SOS Rescue account, accessed August 12, 2026. Figures reflect Google's interface and simulation at the time of review. Budget recommendation was not applied.",
    "Fuente: Recomendaciones y Campañas de Google Ads para Tires SOS Rescue, consultadas el 12 de agosto de 2026. Las cifras corresponden a la simulacion de Google al momento de la revision. La recomendacion no fue aplicada.",
)
source = source.replace('fontSize=25, leading=29', 'fontSize=23, leading=26')
source = source.replace('fontSize=11, leading=16', 'fontSize=10.5, leading=14')
source = source.replace('fontSize=9.5, leading=14', 'fontSize=9, leading=12.5')
source = source.replace('fontSize=14, leading=17', 'fontSize=13.5, leading=16')
source = source.replace('spaceBefore=10, spaceAfter=8', 'spaceBefore=7, spaceAfter=6')
source = source.replace('    KeepTogether,\n', '    KeepTogether,\n    PageBreak,\n')
source = source.replace(
    'story.append(p("Resumen para decision del propietario", "Section"))',
    'story.extend([PageBreak(), p("Resumen para decision del propietario", "Section")])',
)

exec(compile(source, str(source_path), "exec"), {"__name__": "__main__", "__file__": str(source_path)})
