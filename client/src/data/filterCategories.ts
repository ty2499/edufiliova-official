// Shared filter categories for Product Shop and Category Detail pages
// Yellow Images style expandable filter structure with modified terminology to avoid copyright

export interface FilterCategory {
  id: string;
  name: string;
  subcategories: string[];
}

export const filterCategories: FilterCategory[] = [
  {
    id: 'packaging',
    name: 'packaging',
    subcategories: [
      'Bags & Pouches',
      'Containers',
      'Bottles & Flasks',
      'Cartons',
      'Bins & Canisters',
      'Aluminum Cans',
      'Bowls & Cups',
      'Wrapping Packs',
      'Glass Jars',
      'Liquid Containers',
      'Scoops & Pitchers',
      'Tubs & Pots',
      'Stand-up Bags',
      'Individual Packs',
      'Serving Plates',
      'Squeeze Tubes'
    ]
  },
  {
    id: 'apparel',
    name: 'apparel',
    subcategories: [
      'Work Aprons',
      'Carry Bags',
      'Cycling Shorts',
      'Thermal Tights',
      'Body Suits',
      'Knit Sweaters',
      'Outerwear',
      'Character Outfits',
      'Work Suits',
      'Fashion Dresses',
      'Head Covers',
      'Protective Headgear',
      'Pullover Tops',
      'Sport Jackets',
      'Athletic Tops',
      'Knitwear',
      'Tight Pants',
      'Hand Warmers',
      'Full Coverage',
      'Trousers',
      'Sport Shirts',
      'Rain Jackets',
      'Weather Coats',
      'Bath Robes',
      'Footwear',
      'Button Shirts',
      'Athletic Shorts',
      'Tank Tops',
      'Team Uniforms',
      'Training Suits',
      'Fashion Skirts',
      'Athletic Gear',
      'Joggers',
      'Sport Sweatshirts',
      'Water Suits',
      'Casual Tees',
      'Athletic Bras',
      'High Necks',
      'Undergarments',
      'Work Attire',
      'Layering Pieces',
      'Fashion Items',
      'Other Clothing'
    ]
  },
  {
    id: 'vehicles',
    name: 'vehicles',
    subcategories: [
      'Flying Machines',
      'Off-Road Riders',
      'Bicycles',
      'Public Transit',
      'Automobiles',
      'Construction Machines',
      'Motorcycles',
      'Mobile Homes',
      'Electric Riders',
      'Train Systems',
      'Armored Vehicles',
      'Cargo Trailers',
      'Commercial Trucks',
      'Water Vessels',
      'Other Transport',
      'Promotional',
      'Office Supplies',
      'Electronics'
    ]
  },
  {
    id: 'advertising',
    name: 'advertising',
    subcategories: [
      'Sun Shades',
      'Display Flags',
      'Street Seating',
      'Bike Stands',
      'Large Boards',
      'Transit Shelters',
      'Drink Mats',
      'Digital Displays',
      'Moving Stairs',
      'Signal Flags',
      'Fuel Stations',
      'Waste Bins',
      'Storage Units',
      'Patio Covers',
      'Print Ads',
      'Display Screens',
      'Demo Stands',
      'Signage',
      'Notice Boards',
      'Display Units',
      'Desk Signs',
      'Table Displays',
      'Event Shelters',
      'Swing Signs'
    ]
  },
  {
    id: 'stationery',
    name: 'stationery',
    subcategories: []
  },
  {
    id: 'devices',
    name: 'devices',
    subcategories: []
  },
  {
    id: 'file_formats',
    name: 'file formats',
    subcategories: ['PSD', 'AI', 'Sketch', 'Figma', 'XD', 'PDF', 'PNG', 'JPG', 'SVG']
  }
];
