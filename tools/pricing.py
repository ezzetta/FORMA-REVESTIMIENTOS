"""Prices are in ARS per sellable unit; coverage uses that same unit."""
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import html

UNITS = {'unidad', 'placa', 'caja', 'rollo', 'pack', 'cartucho', 'm²', 'metro lineal'}
def number(value, field):
    if value is None or value == '': return None
    if isinstance(value, bool): raise ValueError(f'{field}: ingresar un número')
    try: result = Decimal(str(value))
    except InvalidOperation: raise ValueError(f'{field}: ingresar un número')
    if not result.is_finite() or result < 0: raise ValueError(f'{field}: el valor debe ser positivo')
    return result

def money(value):
    amount = Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return '$ ' + format(amount, ',.2f').replace(',', '_').replace('.', ',').replace('_', '.')

def calculate(product):
    config = product.get('pricing') or {}
    amount = number(config.get('amount'), 'Precio')
    coverage = number(config.get('coverage_m2'), 'Rendimiento')
    discount = number(config.get('discount_percent', 0), 'Descuento') or Decimal(0)
    if discount > 100: raise ValueError('Descuento: debe estar entre 0 y 100')
    if coverage == 0: raise ValueError('Rendimiento: debe ser mayor a cero o quedar vacío')
    unit = config.get('unit') or 'unidad'
    if unit not in UNITS: raise ValueError('Unidad de venta no válida')
    if unit == 'm²': coverage = Decimal(1)
    visible = config.get('show_price', False)
    enabled = bool((product.get('offer') or {}).get('enabled'))
    final = amount
    if amount is not None and enabled:
        final = (amount * (1 - discount / Decimal(100))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    per_m2 = (final / coverage).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP) if visible and final is not None and coverage else None
    return {'amount': float(amount) if amount is not None else None, 'final_amount': float(final) if final is not None and visible else None, 'coverage_m2': float(coverage) if coverage else None, 'unit': unit, 'show_price': visible, 'discount_percent': float(discount) if enabled and amount is not None and visible else 0, 'price_per_m2': float(per_m2) if per_m2 is not None else None}

def apply(product):
    result = calculate(product)
    product['pricing'] = result
    product['price_old'] = ''
    product['price_per_m2_text'] = ''
    if not result['show_price']:
        product['price'] = 'Consultar precio'
    elif result['final_amount'] is not None:
        product['price'] = money(result['final_amount'])
        if result['discount_percent'] > 0: product['price_old'] = money(result['amount'])
        if result['price_per_m2'] is not None: product['price_per_m2_text'] = money(result['price_per_m2']) + ' / m²'
    else:
        offer = product.get('offer') or {}
        if offer.get('enabled') and offer.get('new_price'):
            product['price_old'] = offer.get('old_price') or product.get('price', '')
            product['price'] = offer['new_price']
        else: product['price'] = product.get('price') or 'Consultar precio'
    return product

def markup(product):
    esc = lambda value: html.escape(str(value), quote=True)
    pricing = product['pricing']
    parts = []
    if product.get('price_old'): parts.append('<del>' + esc(product['price_old']) + '</del> ')
    if pricing['discount_percent'] > 0: parts.append('<span class="price-discount">−' + esc(format(pricing['discount_percent'], 'g')) + '%</span> ')
    parts.append(esc(product['price']))
    if pricing['final_amount'] is not None: parts.append(' <span class="price-unit">/ ' + esc(pricing['unit']) + '</span>')
    if product.get('price_per_m2_text'): parts.append('<span class="price-m2">' + esc(product['price_per_m2_text']) + '</span>')
    return ''.join(parts)
