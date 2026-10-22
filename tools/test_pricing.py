import unittest
from pricing import apply, calculate, money, markup

class PricingTests(unittest.TestCase):
    def product(self, **changes):
        config = {'amount':50000, 'unit':'caja', 'coverage_m2':2, 'show_price':True, 'discount_percent':10}
        config.update(changes)
        return {'name':'Ejemplo de prueba', 'price':'Consultar precio', 'pricing':config, 'offer':{'enabled':True}}
    def test_discount_and_coverage_share_the_sellable_unit(self):
        p = apply(self.product())
        self.assertEqual(p['pricing']['final_amount'], 45000)
        self.assertEqual(p['pricing']['price_per_m2'], 22500)
        self.assertEqual(p['price_old'], '$ 50.000,00')
        self.assertIn('$ 22.500,00 / m²', markup(p))
    def test_disabled_offer_keeps_list_price(self):
        p=self.product();p['offer']['enabled']=False
        self.assertEqual(calculate(p)['final_amount'],50000)
    def test_hidden_prices_are_not_exposed_in_rendering(self):
        p=apply(self.product(show_price=False))
        self.assertEqual(p['price'],'Consultar precio')
        self.assertIsNone(p['pricing']['final_amount'])
        self.assertNotIn('50.000',markup(p))
    def test_missing_coverage_does_not_invent_m2_price(self):
        self.assertIsNone(calculate(self.product(coverage_m2=None))['price_per_m2'])
    def test_price_per_m2_uses_one_square_metre(self):
        self.assertEqual(calculate(self.product(unit='m²',coverage_m2=20))['price_per_m2'],45000)
    def test_invalid_commercial_values_fail_before_publication(self):
        for values in [{'amount':-1},{'amount':'500,50'},{'discount_percent':101},{'discount_percent':-1},{'coverage_m2':0},{'coverage_m2':-2},{'amount':'NaN'},{'amount':True},{'unit':'inventada'}]:
            with self.subTest(values=values),self.assertRaises(ValueError): calculate(self.product(**values))
    def test_full_discount_and_zero_prices_are_valid(self):
        self.assertEqual(calculate(self.product(discount_percent=100))['final_amount'],0)
        self.assertEqual(calculate(self.product(amount=0))['price_per_m2'],0)
    def test_legacy_text_is_preserved_without_guessing_a_number(self):
        p=apply({'price':'Desde $21.000','pricing':{'show_price':True},'offer':{'enabled':False}})
        self.assertEqual(p['price'],'Desde $21.000')
        self.assertIsNone(p['pricing']['final_amount'])
    def test_new_products_hide_prices_by_default(self):
        p=apply({'price':'$ 99.000','offer':{'enabled':False}})
        self.assertEqual(p['price'],'Consultar precio')
        self.assertIsNone(p['pricing']['final_amount'])

    def test_financial_rounding(self):
        self.assertEqual(money('1.005'),'$ 1,01')
        self.assertEqual(calculate(self.product(amount=100,discount_percent=0,coverage_m2=3))['price_per_m2'],33.33)

if __name__ == '__main__': unittest.main()
