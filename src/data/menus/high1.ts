import type { Menu, MenuOption } from './types';

// Transcribed from High 1's DoorDash menu, read Nov 25, 2026
// (https://www.doordash.com/store/high-1-south-kingstown-24693498/). DoorDash
// says prices are set by the restaurant; the menu board in the shop lists
// lower prices (a cheese pizza is $11.95 there, $14.35 on DoorDash). Medium
// and extra-large pizzas and calzones are listed separately on DoorDash and
// are combined here as sizes. Paper plates, boxes and free condiments are left out.

const one = (price: number): MenuOption[] => [{ label: 'Price', price }];
const sizes = (medium: number, xl?: number): MenuOption[] =>
  xl === undefined
    ? [{ label: 'Medium', price: medium }]
    : [
        { label: 'Medium', price: medium },
        { label: 'X-Large', price: xl },
      ];
const smallLarge = (small: number, large: number): MenuOption[] => [
  { label: 'Small', price: small },
  { label: 'Large', price: large },
];

export const HIGH_1_MENU: Menu = {
  placeId: 'high-1',
  name: 'High 1',
  phone: '(401) 284-3050',
  website: 'https://www.high1uri.com',
  kicker: 'Kingston Emporium',
  tagline: 'love at first slice',
  theme: 'giraffe',
  signLines: ['HIGH 1 · love at first slice', 'Pizza and more · www.high1uri.com'],
  featured: [
    { section: 'pizza', item: 'Cheese Pizza', label: 'Most ordered on DoorDash', blurb: 'Red sauce and their Italian cheese blend' },
    { section: 'desserts', item: 'Doughboys', label: 'Most ordered on DoorDash', blurb: 'Powdered sugar, cinnamon and caramel drizzle' },
    { section: 'gelato', item: 'Gelato, 2 Scoops', label: 'Homemade gelato', blurb: 'All natural, made in house' },
    { section: 'waffles', item: 'Classic Nordic Waffle', label: 'Nordic waffle', blurb: 'Nutella, strawberry, banana and walnut' },
  ],
  source: 'Menu and prices from High 1’s DoorDash page (Nov 25, 2026); the menu board in the shop lists lower prices',
  sections: [
    {
      id: 'slices',
      title: 'Slices',
      kind: 'main',
      icon: 'pizza',
      items: [
        { name: 'Slice of Cheese', desc: 'A large slice with a golden, crispy crust and melted mozzarella.', options: one(5.95) },
        { name: 'Slice of Roni', desc: 'Red sauce, Italian cheese blend and pepperoni.', options: one(6.55) },
        { name: 'Slice of Chicken Bacon Ranch', desc: 'Grilled chicken, bacon, Italian cheese blend and ranch.', options: one(6.55) },
        { name: 'Slice of Buffalo Chicken', desc: 'Buffalo sauce, Italian cheese blend and buffalo chicken.', options: one(6.55) },
        { name: 'Slice Menu', desc: 'Two slices of your choice and a 12 oz can of soda.', options: one(13.15) },
      ],
    },
    {
      id: 'pizza',
      title: 'Pizza',
      kind: 'main',
      icon: 'pizza',
      notes: ['Medium or extra-large'],
      items: [
        { name: 'Cheese Pizza', desc: 'Red sauce and Italian cheese blend.', options: sizes(14.35, 26.35) },
        { name: 'Roni Pizza', desc: 'Red sauce, Italian cheese blend and pepperoni.', options: sizes(16.75, 29.35) },
        {
          name: 'Chicken Bacon Ranch Pizza',
          desc: 'Grilled chicken, bacon, Italian cheese blend and ranch.',
          options: sizes(17.95, 31.15),
        },
        { name: 'Hawaiian Pizza', desc: 'Light red sauce, Italian cheese blend, pineapple and bacon.', options: sizes(17.95, 29.95) },
        { name: 'BBQ Chicken Pizza', desc: 'BBQ sauce, Italian cheese blend, BBQ chicken and red onions.', options: sizes(16.75, 29.95) },
        { name: 'Buffalo Chicken Pizza', desc: 'Buffalo sauce, Italian cheese blend and buffalo chicken.', options: sizes(18.55, 29.95) },
        { name: 'Grilled Chicken Pizza', desc: 'Red sauce, Italian cheese blend and grilled chicken.', options: sizes(16.75, 29.95) },
        {
          name: 'Honey Mustard Chicken Pizza',
          desc: 'Grilled chicken, honey mustard and Italian cheese blend.',
          options: sizes(16.75, 29.95),
        },
        { name: 'Meat Lover Pizza', desc: 'Pepperoni, sausage, bacon and ground beef.', options: sizes(18.55, 31.15) },
        { name: 'White Pizza', desc: 'Cheddar, mozzarella, ricotta and parmesan.', options: sizes(16.75, 29.95) },
        { name: 'Greek Pizza', desc: 'Red sauce, spinach, feta, black olives and Italian cheese blend.', options: sizes(17.35, 29.95) },
        {
          name: 'Chicken Avocado Quesadilla Pizza',
          desc: 'Grilled chicken, avocado, Italian cheese blend, nacho chips and ranch.',
          options: sizes(18.55, 31.15),
        },
        {
          name: 'Spinach and Ricotta Pizza',
          desc: 'Spinach, onions, mushrooms, Italian cheese blend, feta and ricotta.',
          options: sizes(19.15, 32.35),
        },
        {
          name: 'Veggie Supreme Pizza',
          desc: 'Red sauce, broccoli, onions, mushrooms, green and red peppers, olives and Italian cheese blend.',
          options: sizes(19.15, 32.35),
        },
        {
          name: 'Supreme Pizza',
          desc: 'Red sauce, Italian cheese blend, mushrooms, red and green peppers, pepperoni, sausage and black olives.',
          options: sizes(23.35, 32.95),
        },
        { name: 'Keto Chicken Pizza', desc: 'Grilled chicken, onions, bacon and Italian cheese blend (10 in).', options: sizes(19.15) },
        {
          name: 'Steak Taco Pizza',
          desc: 'Red sauce, filet mignon steak, onions, Italian cheese blend, nacho chips and ranch.',
          options: sizes(26.95, 38.35),
        },
        {
          name: 'Avocado Steak Pizza',
          desc: 'Red sauce, filet mignon steak, avocado, Italian cheese blend and ranch.',
          options: sizes(23.35, 38.35),
        },
        {
          name: 'Philly Steak Pizza',
          desc: 'Filet mignon steak, peppers, onions, mushrooms, Italian cheese blend and nacho cheese sauce.',
          options: sizes(23.95, 39.55),
        },
        {
          name: 'BBQ Steak and Mushrooms Pizza',
          desc: 'BBQ sauce, filet mignon steak, mushrooms and Italian cheese blend.',
          options: sizes(23.35, 38.35),
        },
      ],
    },
    {
      id: 'calzones',
      title: 'Calzones',
      kind: 'main',
      icon: 'food-croissant',
      notes: ['Medium or extra-large, with a side sauce'],
      items: [
        { name: 'Cheese Calzone', desc: 'Ricotta, mozzarella and cheddar, with marinara on the side.', options: sizes(14.35, 26.35) },
        {
          name: 'Buffalo Chicken Calzone',
          desc: 'Crispy buffalo chicken and extra mozzarella, with blue cheese on the side.',
          options: sizes(16.75, 29.95),
        },
        {
          name: 'BBQ Chicken Calzone',
          desc: 'Crispy BBQ chicken and extra mozzarella, with ranch on the side.',
          options: sizes(16.75, 29.95),
        },
        { name: 'Spinach Pie Calzone', desc: 'Pepperoni and spinach with ricotta, mozzarella and cheddar.', options: sizes(16.75, 29.95) },
        {
          name: 'Meat Lover Calzone',
          desc: 'Ricotta, mozzarella, cheddar, pepperoni, Italian sausage and bacon.',
          options: sizes(18.55, 31.15),
        },
      ],
    },
    {
      id: 'pasta',
      title: 'Pasta',
      kind: 'main',
      icon: 'pasta',
      items: [
        { name: 'Baked Ziti', desc: 'Penne with marinara sauce and melted mozzarella.', options: one(13.15) },
        {
          name: 'Chicken Broccoli Alfredo',
          desc: 'Grilled chicken and broccoli in homemade creamy Alfredo over ziti.',
          options: one(16.75),
        },
        { name: 'Creamy Pink Sauce Chicken', desc: 'Grilled chicken in homemade creamy pink sauce over ziti.', options: one(16.75) },
        { name: 'Creamy Curry Chicken', desc: 'Grilled chicken in homemade creamy curry sauce over ziti.', options: one(16.75) },
        { name: 'Creamy Buffalo Chicken', desc: 'Buffalo chicken over ziti in homemade creamy buffalo sauce.', options: one(16.75) },
      ],
    },
    {
      id: 'salads',
      title: 'Salads',
      kind: 'main',
      icon: 'leaf',
      items: [
        { name: 'Garden Salad', desc: 'Lettuce, tomatoes, onion, banana peppers, olives and cucumber.', options: one(11.95) },
        { name: 'Caesar Salad', desc: 'Lettuce, croutons and parmesan.', options: one(11.95) },
        { name: 'Greek Salad', desc: 'Lettuce, tomatoes, onion, banana peppers, olives, cucumber and feta.', options: one(12.95) },
        { name: 'Caprese Salad', desc: 'Lettuce, tomatoes and fresh mozzarella.', options: one(12.95) },
      ],
    },
    {
      id: 'appetizers',
      title: 'Appetizers & Fries',
      kind: 'side',
      icon: 'french-fries',
      items: [
        {
          name: 'Mozzarella Sticks',
          desc: 'With marinara.',
          options: [
            { label: '7 pcs', price: 8.95 },
            { label: '12 pcs', price: 14.35 },
          ],
        },
        {
          name: 'Mac & Cheese Bites',
          desc: 'With marinara.',
          options: [
            { label: '9 pcs', price: 9.55 },
            { label: '14 pcs', price: 13.75 },
          ],
        },
        {
          name: 'Chicken Tenders',
          desc: 'With honey mustard.',
          options: [
            { label: '4 pcs', price: 10.15 },
            { label: '8 pcs', price: 17.35 },
          ],
        },
        {
          name: 'Wing Dings',
          desc: 'Chicken wings with a side sauce: BBQ, blue cheese, buffalo, honey mustard, marinara or ranch.',
          options: [
            { label: '4 pcs', price: 10.15 },
            { label: '7 pcs', price: 16.75 },
          ],
        },
        {
          name: 'Wing Zings',
          desc: 'Chicken wings with a side sauce.',
          options: [
            { label: '4 pcs', price: 10.15 },
            { label: '7 pcs, hot', price: 16.75 },
          ],
        },
        {
          name: 'Jalapeño Poppers',
          desc: 'With cream cheese, served with marinara.',
          options: [
            { label: '6 pcs', price: 10.15 },
            { label: '10 pcs', price: 15.55 },
          ],
        },
        {
          name: 'Philly Cheese Steak Roll',
          desc: 'With marinara.',
          options: [
            { label: '2 pcs', price: 11.35 },
            { label: '4 pcs', price: 20.35 },
          ],
        },
        { name: 'French Fries', options: smallLarge(6.55, 7.75) },
        { name: 'Waffle Fries', options: smallLarge(7.75, 8.95) },
        { name: 'Curly Fries', options: smallLarge(7.75, 8.95) },
        { name: 'Sweet Potato Fries', options: smallLarge(7.75, 8.95) },
        { name: 'Onion Rings', options: smallLarge(7.75, 8.95) },
        { name: 'Cheese Fries', desc: 'Fries topped with melted cheddar.', options: one(10.15) },
      ],
    },
    {
      id: 'gelato',
      title: 'Gelato',
      kind: 'dessert',
      icon: 'ice-cream',
      notes: ['Homemade, all natural'],
      items: [
        { name: 'Gelato, 2 Scoops', desc: 'All natural homemade gelato.', options: one(7.15) },
        { name: 'Build-Your-Own Gelato Bowl', desc: 'Gelato with your choice of toppings.', options: one(5.35) },
        { name: 'Tropical Gelato Bowl', desc: 'Gelato, banana, pineapple and coconut.', options: one(9.5) },
        { name: 'Confection Gelato Bowl', desc: 'Gelato, Nutella, chocolate syrup, strawberries and peanut butter.', options: one(11.35) },
        { name: 'Protein Gelato Bowl', desc: 'Gelato, walnuts, almonds, peanut butter and granola.', options: one(11.6) },
      ],
    },
    {
      id: 'nutella',
      title: 'Nutella Bowls & Calzones',
      kind: 'dessert',
      icon: 'bowl-mix',
      items: [
        { name: 'Build-Your-Own Nutella Bowl', desc: 'Strawberries, bananas and melted Nutella, plus your toppings.', options: one(10.75) },
        { name: 'Nutella Royal', desc: 'Strawberries, bananas, walnut, almond and melted Nutella.', options: one(12.75) },
        { name: 'Strawberry Love', desc: 'Strawberries, granola, coconut and melted Nutella.', options: one(13.35) },
        { name: 'Energy Boost', desc: 'Strawberries, bananas, peanut butter, chocolate chips and Nutella.', options: one(14.5) },
        { name: 'Nutella Calzone', desc: 'Nutella and powdered sugar.', options: one(14.35) },
        { name: 'Nutella Strawberry Calzone', desc: 'Nutella, strawberry and powdered sugar.', options: one(14.35) },
        { name: 'Nutella Banana Calzone', desc: 'Nutella, banana and powdered sugar.', options: one(14.35) },
      ],
    },
    {
      id: 'waffles',
      title: 'Nordic Waffles',
      kind: 'dessert',
      icon: 'grid',
      items: [
        {
          name: 'Build-Your-Own Nordic Waffle',
          desc: 'Waffle with Nutella, peanut butter or half and half, plus your toppings.',
          options: one(10.75),
        },
        { name: 'Classic Nordic Waffle', desc: 'Waffle, Nutella, strawberry, banana and walnut.', options: one(13.1) },
        { name: 'PB Rush Nordic Waffle', desc: 'Waffle, peanut butter, banana and almond.', options: one(13.1) },
        {
          name: 'Perfect Couple Nordic Waffle',
          desc: 'Waffle, Nutella, peanut butter, strawberry, banana and honey.',
          options: one(13.35),
        },
      ],
    },
    {
      id: 'acai',
      title: 'Açaí Bowls',
      kind: 'dessert',
      icon: 'fruit-grapes',
      items: [
        { name: 'Build-Your-Own Açaí Bowl', desc: 'Açaí with your choice of toppings.', options: one(10.75) },
        { name: 'Tropical Açaí Bowl', desc: 'Açaí, coconut flakes, pineapple and banana.', options: one(10.9) },
        { name: 'Protein Açaí Bowl', desc: 'Açaí, granola, walnut, almond and peanut butter.', options: one(14.95) },
        { name: 'Confection Açaí Bowl', desc: 'Açaí, Nutella, chocolate syrup, strawberries and peanut butter.', options: one(15.15) },
      ],
    },
    {
      id: 'desserts',
      title: 'Desserts',
      kind: 'dessert',
      icon: 'cupcake',
      items: [
        { name: 'Doughboys', desc: 'Powdered sugar and cinnamon with caramel drizzle.', options: one(8.35) },
        { name: 'Cannoli', desc: 'With chocolate chips.', options: one(7.15) },
        { name: 'Tiramisu', options: one(7.15) },
        { name: 'Cheesecake', options: one(7.15) },
        { name: 'Chocolate Cake', options: one(7.15) },
        { name: 'Carrot Cake', options: one(7.15) },
        { name: 'Limoncello Cake', options: one(7.15) },
        { name: 'Chocoberry', desc: 'Strawberries dipped in chocolate.', options: one(7.15) },
        { name: 'Macarons (6)', desc: 'Chocolate, vanilla, caramel, raspberry, lemon and pistachio.', options: one(11.95) },
        { name: 'Brownie', options: one(4.75) },
        { name: 'Chocolate Chip Cookie', options: one(4.75) },
        { name: 'M&M Cookie', options: one(4.75) },
      ],
    },
    {
      id: 'drinks',
      title: 'Beverages',
      kind: 'drink',
      icon: 'cup',
      items: [
        {
          name: 'Soda',
          desc: 'Coke, Diet Coke, Sprite, Fanta Orange, Ginger Ale or Fresca.',
          options: [
            { label: '12 oz can', price: 2.35 },
            { label: '20 oz', price: 3.45 },
          ],
        },
        { name: 'Root Beer or Fanta Grape (20 oz)', options: one(3.45) },
        { name: 'Sweet Iced Tea', options: one(3.45) },
        { name: 'Powerade (20 oz)', desc: 'Blue or red.', options: one(3.45) },
        { name: 'Vitamin Water Zero (20 oz)', options: one(3.45) },
        { name: 'Orange Juice (12 oz)', options: one(3.45) },
        { name: 'Monster Energy (16 oz)', desc: 'Original or Zero Ultra.', options: one(4.75) },
        { name: 'Water (16.9 oz)', options: one(2.4) },
      ],
    },
    {
      id: 'addons',
      title: 'Add-ons',
      kind: 'addon',
      icon: 'bottle-tonic-plus',
      items: [
        { name: 'Dipping Sauce', desc: 'Ranch, blue cheese, buffalo, honey mustard, BBQ or cheese sauce.', options: one(1.2) },
        { name: 'Marinara', options: one(0.95) },
        { name: 'Parmesan Cheese', options: one(1.2) },
        { name: 'Chips or Popcorn', options: one(1.65) },
      ],
    },
  ],
};
