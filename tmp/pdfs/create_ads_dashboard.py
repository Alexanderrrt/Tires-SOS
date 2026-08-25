from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.colors import HexColor, white
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing, String
from reportlab.graphics.charts.barcharts import VerticalBarChart, HorizontalBarChart
from reportlab.graphics.charts.doughnut import Doughnut
from reportlab.graphics import renderPDF

OUT = Path('output/pdf/tires_sos_ads_dashboard_2026-07-22.pdf')
OUT.parent.mkdir(parents=True, exist_ok=True)
W,H = landscape(letter)

BG=HexColor('#F3EDE3'); NAVY=HexColor('#14100C'); BLUE=HexColor('#F86000')
CYAN=HexColor('#FF8A3D'); PALE=HexColor('#FFF9F1'); GRID=HexColor('#D5C8B8')
TEXT=HexColor('#14100C'); MUTED=HexColor('#776A5D'); GREEN=HexColor('#4CAF6D')
ORANGE=HexColor('#C94D00'); RED=HexColor('#A33B22'); PURPLE=HexColor('#7D8894')
COLORS=[NAVY,BLUE,CYAN,GREEN,ORANGE,PURPLE,RED]
LOGO = Path('public/logo.jpg')
pdfmetrics.registerFont(TTFont('Brand', r'C:\Windows\Fonts\arial.ttf'))
pdfmetrics.registerFont(TTFont('BrandBold', r'C:\Windows\Fonts\arialbd.ttf'))

def money(v): return f'${v:,.2f}'

def box(c,x,y,w,h,fill=white,stroke=GRID,r=0):
    c.setFillColor(fill); c.setStrokeColor(stroke); c.setLineWidth(.6)
    if r: c.roundRect(x,y,w,h,r,fill=1,stroke=1)
    else: c.rect(x,y,w,h,fill=1,stroke=1)

def text(c,s,x,y,size=9,color=TEXT,font='Brand',align='left'):
    c.setFont(font,size); c.setFillColor(color)
    if align=='center': c.drawCentredString(x,y,s)
    elif align=='right': c.drawRightString(x,y,s)
    else: c.drawString(x,y,s)

def wrap(c,s,x,y,maxw,size=8.4,leading=10.5,color=TEXT,font='Brand',max_lines=5):
    words=s.split(); lines=[]; cur=''
    for word in words:
        test=(cur+' '+word).strip()
        if stringWidth(test,font,size)<=maxw: cur=test
        else:
            if cur: lines.append(cur)
            cur=word
    if cur: lines.append(cur)
    for i,line in enumerate(lines[:max_lines]): text(c,line,x,y-i*leading,size,color,font)

def page_header(c,title,subtitle,tag,page):
    c.setFillColor(BG); c.rect(0,0,W,H,fill=1,stroke=0)
    box(c,116,H-58,558,42,white,white)
    text(c,title,395,H-45,19,NAVY,'BrandBold','center')
    box(c,16,H-62,90,50,NAVY,NAVY)
    box(c,684,H-58,92,42,BLUE,BLUE)
    text(c,tag,730,H-39,9,NAVY,'BrandBold','center'); text(c,'ADS',730,H-51,7,NAVY,'BrandBold','center')
    text(c,subtitle,16,13,7,MUTED)
    text(c,f'Página {page} de 4',776,13,7.5,MUTED,align='right')

def brand_logo(c):
    box(c,16,H-62,90,50,NAVY,NAVY)
    c.drawInlineImage(str(LOGO),18,H-60,86,46,preserveAspectRatio=True,anchor='c')

def kpi(c,x,y,w,h,value,label,accent=BLUE,sub=None):
    box(c,x,y,w,h,white,GRID)
    c.setFillColor(accent); c.rect(x,y,w,4,fill=1,stroke=0)
    text(c,value,x+w/2,y+h-32,21,NAVY,'BrandBold','center')
    text(c,label.upper(),x+w/2,y+17,7.8,MUTED,'BrandBold','center')
    if sub: text(c,sub,x+w/2,y+7,6.5,MUTED,align='center')

def panel_title(c,s,x,y,w):
    text(c,s,x+10,y-18,11,NAVY,'BrandBold')
    c.setStrokeColor(GRID); c.line(x+10,y-24,x+w-10,y-24)

def draw_vertical(c,x,y,w,h,cats,series,legend,colors,title,ymax=None):
    box(c,x,y,w,h,white,GRID); panel_title(c,title,x,y+h,w)
    d=Drawing(w-20,h-40); chart=VerticalBarChart(); chart.x=34; chart.y=28; chart.height=h-82; chart.width=w-75
    chart.data=series; chart.categoryAxis.categoryNames=cats; chart.categoryAxis.labels.fontSize=7; chart.categoryAxis.labels.fontName='Brand'
    chart.valueAxis.labels.fontSize=7; chart.valueAxis.labels.fontName='Brand'; chart.valueAxis.valueMin=0
    if ymax: chart.valueAxis.valueMax=ymax
    chart.valueAxis.strokeColor=GRID; chart.categoryAxis.strokeColor=GRID
    chart.barSpacing=3; chart.groupSpacing=8
    for i,col in enumerate(colors): chart.bars[i].fillColor=col; chart.bars[i].strokeColor=col
    d.add(chart)
    lx=38
    for i,name in enumerate(legend):
        d.add(String(lx+10,8,name,fontName='Brand',fontSize=7,fillColor=TEXT));
        from reportlab.graphics.shapes import Rect
        d.add(Rect(lx,7,7,7,fillColor=colors[i],strokeColor=colors[i])); lx += 92
    renderPDF.draw(d,c,x+10,y+4)

def draw_horizontal(c,x,y,w,h,cats,values,title,color=BLUE,value_fmt=None):
    box(c,x,y,w,h,white,GRID); panel_title(c,title,x,y+h,w)
    d=Drawing(w-20,h-40); chart=HorizontalBarChart(); chart.x=92; chart.y=22; chart.height=h-74; chart.width=w-145
    chart.data=[values]; chart.categoryAxis.categoryNames=cats; chart.categoryAxis.labels.fontSize=7.5; chart.categoryAxis.labels.fontName='Brand'
    chart.valueAxis.labels.fontSize=7; chart.valueAxis.labels.fontName='Brand'; chart.valueAxis.valueMin=0; chart.valueAxis.strokeColor=GRID; chart.categoryAxis.strokeColor=GRID
    chart.bars[0].fillColor=color; chart.bars[0].strokeColor=color; chart.barWidth=10
    d.add(chart); renderPDF.draw(d,c,x+10,y+4)

def draw_donut(c,x,y,w,h,values,labels,title,colors=COLORS):
    box(c,x,y,w,h,white,GRID); panel_title(c,title,x,y+h,w)
    d=Drawing(w-20,h-40); pie=Doughnut(); pie.x=12; pie.y=8; pie.width=min(125,w*.55); pie.height=min(125,h-55); pie.data=values; pie.labels=None; pie.innerRadiusFraction=.58
    for i in range(len(values)): pie.slices[i].fillColor=colors[i]; pie.slices[i].strokeColor=white
    d.add(pie); total=sum(values); lx=min(155,w*.61); ly=h-62
    from reportlab.graphics.shapes import Rect
    for i,(lab,val) in enumerate(zip(labels,values)):
        d.add(Rect(lx,ly-i*18,8,8,fillColor=colors[i],strokeColor=colors[i])); pct=100*val/total if total else 0
        d.add(String(lx+13,ly-i*18, f'{lab}: {pct:.1f}%',fontName='Brand',fontSize=7.4,fillColor=TEXT))
    renderPDF.draw(d,c,x+10,y+4)

def table(c,x,y,w,row_h,headers,rows,widths):
    total=sum(widths); widths=[w*v/total for v in widths]
    c.setFillColor(NAVY); c.rect(x,y-row_h,w,row_h,fill=1,stroke=0)
    xx=x
    for head,cw in zip(headers,widths): text(c,head,xx+5,y-row_h+7,7.4,white,'BrandBold'); xx+=cw
    for r,row in enumerate(rows):
        yy=y-row_h*(r+2); c.setFillColor(white if r%2==0 else PALE); c.rect(x,yy,w,row_h,fill=1,stroke=0)
        xx=x
        for val,cw in zip(row,widths): text(c,str(val),xx+5,yy+7,7.6,TEXT); xx+=cw
    c.setStrokeColor(GRID); c.rect(x,y-row_h*(len(rows)+1),w,row_h*(len(rows)+1),fill=0,stroke=1)
    xx=x
    for cw in widths[:-1]: xx+=cw; c.line(xx,y-row_h*(len(rows)+1),xx,y)

def page_google(c):
    page_header(c,'Panel de Rendimiento de Google Ads','Fuente: Google Ads | Hora del Pacífico | 16-22 jul 2026','GOOGLE',1)
    draw_vertical(c,16,316,378,225,['Santa Clara','Alameda','Santa Cruz'],[[54,7,4],[52.57,18,3.15]],['Clics','Gasto ($)'],[BLUE,HexColor('#9AA6B2')],'Clics y Gasto por Condado',60)
    kpi(c,410,466,115,75,'3,495','Impresiones',NAVY); kpi(c,533,466,115,75,'65','Clics',BLUE); kpi(c,656,466,120,75,'1.86%','CTR',CYAN)
    kpi(c,410,382,115,75,'$73.71','Gasto',GREEN); kpi(c,533,382,115,75,'9','Conversiones',ORANGE); kpi(c,656,382,120,75,'$8.19','Costo / conversión',PURPLE)
    draw_horizontal(c,16,71,378,228,['Santa Clara','Alameda','Santa Cruz'],[2990,417,88],'Impresiones por Condado',NAVY)
    draw_donut(c,410,71,366,228,[2990,417,88],['Santa Clara','Alameda','Santa Cruz'],'Distribución Geográfica',[NAVY,BLUE,CYAN])
    brand_logo(c)

def page_meta(c):
    page_header(c,'Panel de Rendimiento de Meta Ads','Fuente: Meta Ads Manager | 22 jun-21 jul 2026','META',2)
    draw_vertical(c,16,316,378,225,['Anuncio v1','Anuncio v2','Llamadas + Web'],[[460,2475,277],[9.56,41.15,3.51]],['Alcance','Gasto ($)'],[BLUE,HexColor('#9AA6B2')],'Alcance y Gasto por Anuncio',2600)
    kpi(c,410,466,115,75,'3,212*','Alcance sumado',NAVY, 'puede repetirse'); kpi(c,533,466,115,75,'9','Llamadas',BLUE); kpi(c,656,466,120,75,'$54.22','Gasto',GREEN)
    kpi(c,410,382,115,75,'$6.02','Costo prom. / llamada',ORANGE); kpi(c,533,382,115,75,'3','Anuncios activos',CYAN); kpi(c,656,382,120,75,'6','Ubicaciones',PURPLE)
    draw_donut(c,16,71,378,228,[1999,899,137,61,32,3],['FB Reels','FB Feed','IG Reels','IG Feed','IG Stories','Marketplace'],'Donde Aparecieron los Anuncios',[NAVY,BLUE,CYAN,GREEN,ORANGE,PURPLE])
    box(c,410,71,366,228,white,GRID); panel_title(c,'Resultados por Anuncio',410,299,366)
    table(c,420,258,346,25,['Anuncio','Alcance','Llamadas','Gasto'],[
        ['Anuncio de clientes v1','460','2','$9.56'],['Anuncio de clientes v2','2,475','7','$41.15'],['Llamadas + Web','277','0','$3.51']], [2.3,0.8,0.7,0.8])
    text(c,'Dato de ubicación',420,149,9,NAVY,'BrandBold')
    wrap(c,'Facebook Reels concentró la mayor parte de la entrega observada. El gráfico suma filas por anuncio y es direccional; no representa alcance geográfico sin duplicados.',420,134,342,8,10.5)
    brand_logo(c)

def page_yelp(c):
    page_header(c,'Panel de Rendimiento de Yelp Ads','Tires SOS Rescue | 1407 N 10th St, San Jose, CA | Ultimos 30 dias','YELP',3)
    draw_horizontal(c,16,316,378,225,['Impresiones / 100','Clics','Visitas','Clientes potenciales'],[272,104,68,51],'Embudo de Interacción (impresiones escaladas)',NAVY)
    kpi(c,410,466,115,75,'27.2k','Impresiones',NAVY); kpi(c,533,466,115,75,'104','Clics en anuncio',BLUE); kpi(c,656,466,120,75,'68','Visitas a pagina',CYAN)
    kpi(c,410,382,115,75,'51','Clientes potenciales',GREEN); kpi(c,533,382,115,75,'$4.55','CPC promedio',ORANGE); kpi(c,656,382,120,75,'$8.69','Costo prom. / cliente',PURPLE)
    draw_donut(c,16,71,378,228,[68,20],['Visitas por anuncios','Visitas orgánicas'],'Contribución a Visitas',[NAVY,CYAN])
    box(c,410,71,366,228,white,GRID); panel_title(c,'Gasto y Contribución',410,299,366)
    kpi(c,425,204,156,67,'$391.26','Gasto 1-21 jul',GREEN)
    kpi(c,595,204,156,67,'99%','Impresiones de anuncios',NAVY)
    kpi(c,425,126,156,67,'77%','Visitas de anuncios',BLUE)
    kpi(c,595,126,156,67,'100%','Clientes de anuncios',ORANGE)
    wrap(c,'Yelp asocia la entrega con el mercado San José-Sunnyvale-Santa Clara. El panel no mostró un desglose geográfico más detallado.',425,101,326,7.7,9.5,MUTED)
    brand_logo(c)

def page_summary(c):
    page_header(c,'Resumen Ejecutivo de Anuncios TIRES SOS','Vista multiplataforma | Preparado 22 jul 2026','RESUMEN',4)
    kpi(c,16,466,180,75,'$519.19*','Gasto observado',GREEN,'períodos diferentes')
    kpi(c,208,466,180,75,'9,919+','Exposición / alcance',NAVY,'sin eliminar duplicados')
    kpi(c,400,466,180,75,'238','Clics + clientes + llamadas',BLUE,'resultados combinados')
    kpi(c,592,466,184,75,'3','Plataformas revisadas',PURPLE)
    draw_vertical(c,16,207,378,243,['Google','Meta','Yelp'],[[73.71,54.22,391.26],[8.19,6.02,8.69]],['Gasto ($)','Costo / resultado ($)'],[HexColor('#9AA6B2'),BLUE],'Gasto y Eficiencia',410)
    draw_donut(c,410,207,366,243,[73.71,54.22,391.26],['Google','Meta','Yelp'],'Distribución del Gasto',[NAVY,BLUE,CYAN])
    box(c,16,51,760,140,white,GRID); panel_title(c,'Resumen para Gerencia',16,191,760)
    table(c,26,154,450,24,['Plataforma','Alcance / exposición','Interacción','Gasto'],[
        ['Google','3,495 impresiones','65 clics; 9 conversiones','$73.71'],
        ['Meta','3,212 alcance sumado*','9 llamadas','$54.22'],
        ['Yelp','27.2k impresiones','104 clics; 51 clientes','$391.26']], [1.0,1.45,1.65,0.9])
    text(c,'Lo más importante',496,155,9,NAVY,'BrandBold')
    wrap(c,'Google y Meta muestran una eficiencia parecida por resultado principal. Yelp genera el mayor volumen, pero también concentra el mayor gasto. Conviene alinear los períodos antes de cambiar presupuestos.',496,140,262,8,10.5)
    wrap(c,'*Los totales combinan períodos y definiciones diferentes. El alcance de Meta y la exposición del resumen pueden incluir duplicados.',496,90,262,7.4,9.4,MUTED)
    brand_logo(c)

c=canvas.Canvas(str(OUT),pagesize=(W,H))
c.setTitle('Panel de Rendimiento de Anuncios - TIRES SOS Rescue')
c.setAuthor('TIRES SOS Rescue')
for fn in (page_google,page_meta,page_yelp,page_summary): fn(c); c.showPage()
c.save(); print(OUT.resolve())
