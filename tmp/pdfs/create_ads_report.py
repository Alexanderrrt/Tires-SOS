from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.lib.colors import HexColor
from pathlib import Path

OUT = Path('output/pdf/tires_sos_ads_report_2026-07-22.pdf')
OUT.parent.mkdir(parents=True, exist_ok=True)

NAVY = HexColor('#10233F'); BLUE = HexColor('#2878D0'); TEAL = HexColor('#0E9F8A')
LIGHT = HexColor('#F3F6FA'); MID = HexColor('#D8E1EC'); DARK = HexColor('#26364A')
GREEN = HexColor('#177A64'); ORANGE = HexColor('#C46A18')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleX', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=25, leading=29, textColor=NAVY, spaceAfter=10))
styles.add(ParagraphStyle(name='SubX', parent=styles['Normal'], fontSize=10, leading=15, textColor=DARK))
styles.add(ParagraphStyle(name='H1X', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=NAVY, spaceBefore=8, spaceAfter=10))
styles.add(ParagraphStyle(name='H2X', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=12, leading=15, textColor=BLUE, spaceBefore=9, spaceAfter=6))
styles.add(ParagraphStyle(name='BodyX', parent=styles['BodyText'], fontSize=9, leading=13, textColor=DARK, spaceAfter=6))
styles.add(ParagraphStyle(name='SmallX', parent=styles['BodyText'], fontSize=7.7, leading=10.5, textColor=DARK))
styles.add(ParagraphStyle(name='Metric', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=18, leading=20, textColor=NAVY, alignment=TA_CENTER))
styles.add(ParagraphStyle(name='MetricLabel', parent=styles['Normal'], fontSize=7.5, leading=9, textColor=DARK, alignment=TA_CENTER))
styles.add(ParagraphStyle(name='Note', parent=styles['BodyText'], fontSize=7.5, leading=10, textColor=HexColor('#54677D')))

def P(txt, style='BodyX'): return Paragraph(txt, styles[style])

def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY); canvas.rect(0, letter[1]-0.22*inch, letter[0], 0.22*inch, fill=1, stroke=0)
    canvas.setFont('Helvetica', 7); canvas.setFillColor(HexColor('#66788C'))
    canvas.drawString(0.55*inch, 0.34*inch, 'TIRES SOS Rescue | Paid Advertising Performance')
    canvas.drawRightString(letter[0]-0.55*inch, 0.34*inch, f'Page {doc.page}')
    canvas.restoreState()

def metric_cards(items):
    n=len(items)
    cells=[]
    for value,label in items:
        cells.append([P(value,'Metric'), Spacer(1,3), P(label,'MetricLabel')])
    cells=[cells]
    t=Table(cells, colWidths=[(7.4*inch)/n]*n, rowHeights=[0.72*inch])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),LIGHT),('BOX',(0,0),(-1,-1),0.6,MID),('INNERGRID',(0,0),(-1,-1),0.6,MID),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
    return t

def data_table(data, widths, header=True):
    rows=[]
    for r,row in enumerate(data): rows.append([P(str(v),'SmallX') for v in row])
    t=Table(rows,colWidths=widths,repeatRows=1 if header else 0,hAlign='LEFT')
    cmds=[('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),0.45,MID),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]
    if header: cmds += [('BACKGROUND',(0,0),(-1,0),NAVY),('TEXTCOLOR',(0,0),(-1,0),colors.white)]
    for r in range(1 if header else 0,len(rows)):
        if r%2==0: cmds.append(('BACKGROUND',(0,r),(-1,r),LIGHT))
    t.setStyle(TableStyle(cmds)); return t

story=[]
story += [Spacer(1,0.24*inch), P('Paid Advertising Performance Report','TitleX'), P('TIRES SOS Rescue | Prepared July 22, 2026','SubX'), Spacer(1,0.16*inch)]
story += [P('Executive snapshot','H1X')]
story += [metric_cards([('$519.19','OBSERVED SPEND*'),('9,919+','DELIVERIES / REACH PROXY'),('238','CLICKS / LEADS / CALLS'),('3','PLATFORMS')]), Spacer(1,0.14*inch)]
story += [P('<b>What this report covers.</b> A read-only review of the logged-in Google Ads, Meta Ads Manager, and Yelp Ads dashboards. Each platform is separated below because the dashboards use different date windows and metric definitions.','BodyX')]
story += [P('<b>Key takeaway.</b> Google generated 65 clicks and 9 conversions at $8.19 per conversion during its first seven days. Meta generated 9 tracked calls at $6.02 per call across three ads. Yelp produced the largest engagement volume: 104 ad clicks, 68 ad-driven page visits, and 51 leads in its last-30-day performance view.','BodyX')]
story += [P('*Observed spend is a simple sum of platform figures with different reporting windows: Google $73.71 (Jul 16-22), Meta $54.22 (Jun 22-Jul 21), and Yelp $391.26 (Jul 1-21 billing period). It is not a same-period blended total.','Note')]
story += [Spacer(1,0.12*inch), P('Platform comparison','H2X')]
story += [data_table([
 ['Platform','Reporting window','Reach / exposure','Interaction / result','Spend'],
 ['Google Ads','Jul 16-22, 2026','3,495 impressions (unique reach not shown)','65 clicks; 9 conversions','$73.71'],
 ['Meta Ads','Jun 22-Jul 21, 2026','3,212 summed ad-level reach*','9 calls','$54.22'],
 ['Yelp Ads','Last 30 days; spend Jul 1-21','27.2k impressions','104 clicks; 68 page visits; 51 leads','$391.26'],
 ],[1.0*inch,1.22*inch,1.65*inch,1.75*inch,0.8*inch])]
story += [P('*Meta reach is the sum of 460, 2,475, and 277 shown for three ads. It may double-count people exposed to more than one ad.','Note')]
story += [PageBreak()]

story += [P('Google Ads','H1X'), P('Campaign #1 | Performance Max | Pacific time','SubX'), Spacer(1,0.1*inch)]
story += [metric_cards([('3,495','IMPRESSIONS'),('65','CLICKS'),('9','CONVERSIONS'),('$73.71','SPEND')]), Spacer(1,0.12*inch)]
story += [P('When','H2X'), P('July 16-22, 2026. The account labels this as the full available period.','BodyX')]
story += [P('Where and performance by county','H2X')]
story += [data_table([
 ['Targeted county','Impressions','Clicks','CTR','Spend','Conversions'],
 ['Santa Clara County, CA','2,990','54','1.81%','$52.57','7'],
 ['Alameda County, CA','417','7','1.68%','$18.00','2'],
 ['Santa Cruz County, CA','88','4','4.55%','$3.15','0'],
 ],[2.05*inch,0.85*inch,0.62*inch,0.62*inch,0.78*inch,0.82*inch])]
story += [P('Interaction detail','H2X'), P('The campaign recorded 65 clicks at an average CPC of $1.13 and a 1.86% CTR. Nine conversions were recorded at $8.19 per conversion, with a 6.67% conversion rate. Santa Clara County produced 78% of clicks and 78% of conversions.','BodyX')]
story += [P('Reach note','H2X'), P('Google did not display a unique-people reach metric in the campaign view. Impressions are reported as exposure, not unique people.','BodyX')]
story += [PageBreak(), P('Meta Ads','H1X'), P('Three active ads | Facebook and Instagram','SubX'), Spacer(1,0.1*inch)]
story += [metric_cards([('3,212*','SUMMED REACH'),('9','TRACKED CALLS'),('$54.22','SPEND'),('$6.02','AVG COST / CALL')]), Spacer(1,0.1*inch)]
story += [P('When','H2X'), P('June 22-July 21, 2026 (last 30 days shown in Ads Manager).','BodyX')]
story += [P('Ad-level results','H2X')]
story += [data_table([
 ['Ad','Reach','Calls','Spend','Cost / call'],
 ['Lead ad - version 1','460','2','$9.56','$4.78'],
 ['Lead ad - version 2','2,475','7','$41.15','$5.88'],
 ['Emergency Tire Rescue - Calls + Web','277','0','$3.51','n/a'],
 ],[2.72*inch,0.8*inch,0.7*inch,0.85*inch,0.9*inch])]
story += [P('Where ads appeared','H2X'), P('Delivery was visible across Facebook Reels, Facebook Feed, Facebook Marketplace, Instagram Feed, Instagram Reels, and Instagram Stories. The dashboard view exposed placement, not a geographic region breakdown.','BodyX')]
story += [P('*Summed reach may include duplicate people across ads.','Note')]
story += [PageBreak()]

story += [P('Yelp Ads','H1X'), P('Tires SOS Rescue | San Jose business profile','SubX'), Spacer(1,0.1*inch)]
story += [metric_cards([('27.2k','IMPRESSIONS'),('104','AD CLICKS'),('68','PAGE VISITS'),('51','LEADS')]), Spacer(1,0.12*inch)]
story += [P('When','H2X'), P('Performance metrics are labeled “Last 30 days.” Spend is for the current billing period, July 1-21, 2026.','BodyX')]
story += [P('Where','H2X'), P('The ads are associated with the Tires SOS Rescue Yelp business profile at 1407 N 10th St, San Jose, CA 95112. Yelp also references the San Jose-Sunnyvale-Santa Clara market. A detailed audience-location breakdown was not shown in the current dashboard.','BodyX')]
story += [P('Engagement and cost','H2X')]
story += [data_table([
 ['Metric','Value','Interpretation'],
 ['Ad impressions','27.2k','99% of total profile impressions came from ads'],
 ['Ad clicks','104','Direct interactions with the Yelp ad'],
 ['Ad-driven page visits','68','77% of the 88 total page visits'],
 ['Ad-driven leads','51','100% of the 51 leads shown'],
 ['Spend','$391.26','July 1-21 billing period'],
 ['Average CPC','$4.55','Dashboard-reported average cost per click'],
 ['Average cost per lead','$8.69','Dashboard-reported average'],
 ],[1.7*inch,1.0*inch,3.7*inch])]
story += [Spacer(1,0.13*inch), P('Reporting notes','H2X')]
story += [P('1. Platform definitions differ: impressions are ad deliveries; reach is unique people only when explicitly labeled; calls, conversions, page visits, and leads are platform-attributed outcomes.','SmallX'), P('2. Reporting windows are not aligned. Use the platform sections for accurate interpretation and avoid treating the observed spend sum as a same-period total.','SmallX'), P('3. Figures were transcribed from the live dashboards on July 22, 2026. Ad platforms may later revise attribution.','SmallX')]

doc=SimpleDocTemplate(str(OUT),pagesize=letter,rightMargin=0.55*inch,leftMargin=0.55*inch,topMargin=0.48*inch,bottomMargin=0.55*inch,title='TIRES SOS Rescue Paid Advertising Performance Report',author='OpenAI Codex')
doc.build(story,onFirstPage=header_footer,onLaterPages=header_footer)
print(OUT.resolve())
