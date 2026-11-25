import type { Menu, MenuOption } from './types';

// Transcribed from Taste of Korea (Kingston)'s DoorDash menu, read Nov 25,
// 2026 (https://www.doordash.com/store/taste-of-korea-kingston-36482961/).
// DoorDash says these prices are set by the restaurant; prices at the counter
// may differ. Names keep the Korean the menu gives. "Most liked" ranks are
// DoorDash's own, from its customers' ratings.

const one = (price: number): MenuOption[] => [{ label: 'Price', price }];

export const TASTE_OF_KOREA_MENU: Menu = {
  placeId: 'taste-of-korea',
  name: 'Taste of Korea',
  phone: '401-363-9777',
  kicker: 'Kingston Emporium',
  theme: 'korean',
  signLines: ['Taste of KOREA · 401-363-9777', 'Boba Tea (neon sign in the window)'],
  featured: [
    {
      section: 'rice',
      item: 'Chicken Mayo 치킨마요',
      label: '#1 most liked on DoorDash',
      blurb: 'Crispy chicken and fried rice cakes in a sweet, savory glaze',
    },
    { section: 'street-food', item: 'K-Chicken Bites 닭강정', label: '#3 most liked on DoorDash', blurb: 'Spicy option available' },
    { section: 'rice', item: 'Bulgogi Over Rice 불고기덮밥', label: 'Korean classic', blurb: 'Marinated beef over steamed rice' },
    { section: 'bubble-tea', item: 'Milk Tea 밀크버블티', label: 'Bubble tea', blurb: 'Honeydew, lychee, taro and more' },
  ],
  source: 'Menu and prices from Taste of Korea’s DoorDash page (Nov 25, 2026); prices at the counter may differ',
  sections: [
    {
      id: 'street-food',
      title: 'K-Street Food & Etc.',
      kind: 'side',
      icon: 'food-drumstick',
      items: [
        { name: 'K-Chicken Bites 닭강정', desc: 'Boneless chicken pieces glazed in a sticky, sweet and savory sauce. Spicy option available.', options: one(11.49) },
        { name: 'Mandu 만두', desc: 'Deep-fried Korean-style dumplings, with Korean-style soy sauce.', options: one(8.99) },
      ],
    },
    {
      id: 'noodles',
      title: 'Noodles',
      kind: 'main',
      icon: 'noodles',
      items: [
        {
          name: 'K-Ramyun Noodle (BYOR)',
          desc: 'Chewy noodles in a rich, spicy broth, cooked with scallions and scrambled egg.',
          options: one(12.49),
        },
        { name: 'Japchae 잡채', desc: 'Stir-fried glass noodles with vegetables and meat in a savory soy and sesame sauce.', options: one(18.49) },
      ],
    },
    {
      id: 'rice',
      title: 'Over Rice',
      kind: 'main',
      icon: 'rice',
      items: [
        { name: 'Chicken Mayo 치킨마요', desc: 'Boneless chicken pieces and fried rice cakes glazed in a sticky, sweet and savory sauce.', options: one(12.49) },
        { name: 'Bulgogi Over Rice 불고기덮밥', desc: 'Tender marinated beef over a bed of steamed rice.', options: one(19.49) },
        {
          name: 'Bibimbap 비빔밥',
          desc: 'Warm rice topped with seasoned vegetables, meat and a fried egg, to mix with spicy gochujang sauce.',
          options: one(18.49),
        },
        { name: 'Jeyuk Over Rice 제육덮밥', desc: 'Stir-fried spicy marinated pork over rice: sweet, savory and spicy.', options: one(18.49) },
      ],
    },
    {
      id: 'soup',
      title: 'Soup & Stew',
      kind: 'main',
      icon: 'pot-steam',
      items: [
        { name: 'Kimchi Stew 김치찌개', desc: 'Kimchi, pork and vegetables with Korean spices.', options: one(18.49) },
        { name: 'Mandu Soup 만둣국', desc: 'Savory pork dumplings in a clear broth.', options: one(14.99) },
      ],
    },
    {
      id: 'bubble-tea',
      title: 'Bubble Tea',
      kind: 'drink',
      icon: 'cup',
      notes: ['Tea base: green 녹차, plain 일반 or black 홍차'],
      items: [
        {
          name: 'Milk Tea 밀크버블티',
          desc: 'Honeydew, lychee, taro and more, with jelly or popping boba toppings.',
          options: one(7.99),
        },
        { name: 'Juice Tea 주스버블티', desc: 'Juice flavors like grape, ginger or mango, with toppings such as tapioca or coffee jelly.', options: one(7.99) },
      ],
    },
  ],
};
