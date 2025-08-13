import db from './config/database.js';
import { MenuItem } from './models/menuItems.js';

async function fixNullCategories() {
  try {
    await db.authenticate();
    console.log('🔧 Starting to fix null category IDs...');

    // Category mappings based on the database
    const categoryMappings = {
      16: 'appetizers',
      17: 'burgers', 
      18: 'sandwiches',
      19: 'plates',
      20: 'pasta',
      21: 'sushi',
      22: 'pizza',
      23: 'salads',
      24: 'desserts',
      25: 'breakfast',
      26: 'shisha'
    };

    // Define the items that need category fixes
    const itemUpdates = [
      // Appetizers (ID: 16) - Items 644-660
      { ids: [644, 645, 646, 647, 648, 649, 650, 651, 652, 653, 654, 655, 656, 657, 658, 659, 660], categoryId: 16 },
      
      // Main Plates/Pasta/Pizza (ID: 19) - Items 661-696, 738-748, 800-811, 815, 818-819, 823-831, 926-929, 933, 937
      { ids: [661, 662, 663, 664, 665, 666, 667, 668, 669, 670, 671, 672, 673, 674, 675, 676, 677, 678, 679, 680, 681, 682, 683, 684, 685, 686, 687, 688, 689, 690, 691, 692, 693, 694, 695, 696, 738, 739, 740, 741, 742, 743, 744, 745, 746, 747, 748, 800, 801, 802, 803, 804, 805, 806, 807, 808, 809, 810, 811, 815, 818, 819, 823, 824, 825, 826, 827, 828, 830, 831, 842, 843, 844, 845, 846, 847, 851, 852, 854, 855, 856, 857, 876, 926, 927, 928, 929, 933, 937], categoryId: 19 },
      
      // Sushi (ID: 21) - Items 697-737
      { ids: [697, 698, 699, 700, 701, 702, 703, 704, 705, 706, 707, 708, 709, 710, 711, 712, 713, 714, 715, 716, 717, 718, 719, 720, 721, 722, 723, 724, 725, 726, 727, 728, 729, 730, 731, 732, 733, 734, 735, 736, 737], categoryId: 21 },
      
      // Salads (ID: 23) - Items 749-757
      { ids: [749, 750, 751, 752, 753, 754, 755, 756, 757], categoryId: 23 },
      
      // Sandwiches (ID: 18) - Items 758-768
      { ids: [758, 759, 760, 761, 762, 763, 764, 765, 766, 767, 768], categoryId: 18 },
      
      // Burgers (ID: 17) - Items 769-782
      { ids: [769, 770, 771, 772, 773, 774, 775, 776, 777, 778, 779, 780, 781, 782], categoryId: 17 },
      
      // Cold Beverages - Items with null categoryId (783-799, 812-814, 816-817, 820-822, 829, 832-841, 848-850, 853, 877-895, 930-931)
      { ids: [783, 784, 785, 786, 787, 788, 789, 790, 791, 792, 793, 794, 795, 796, 797, 798, 799, 812, 813, 814, 816, 817, 820, 821, 822, 829, 832, 833, 834, 835, 836, 837, 838, 839, 840, 841, 848, 849, 850, 853, 877, 878, 879, 880, 881, 882, 883, 884, 885, 886, 887, 888, 889, 890, 891, 892, 893, 894, 895, 896, 897, 898, 899, 900, 901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912, 913, 914, 915, 916, 917, 918, 919, 920, 921, 922, 923, 924, 925, 930, 931], categoryId: 25 }, // Using breakfast as cold beverages category doesn't exist
      
      // Desserts (ID: 24) - Items 858-870
      { ids: [858, 859, 860, 861, 862, 863, 864, 865, 866, 867, 868, 869, 870], categoryId: 24 },
      
      // Shisha (ID: 26) - Items 871-875
      { ids: [871, 872, 873, 874, 875], categoryId: 26 },
      
      // Hot Beverages - Items 932, 934-941
      { ids: [932, 934, 935, 936, 938, 939, 940, 941], categoryId: 25 } // Using breakfast as hot beverages category doesn't exist
    ];

    let totalUpdated = 0;

    for (const update of itemUpdates) {
      const [updatedCount] = await MenuItem.update(
        { categoryId: update.categoryId },
        { 
          where: { 
            id: update.ids,
            categoryId: null 
          } 
        }
      );
      
      if (updatedCount > 0) {
        console.log(`✅ Updated ${updatedCount} items to category ID ${update.categoryId}`);
        totalUpdated += updatedCount;
      }
    }

    console.log(`🎉 Successfully updated ${totalUpdated} menu items with proper category IDs!`);
    
    // Verify the fix
    const remainingNullItems = await MenuItem.count({
      where: { categoryId: null }
    });
    
    console.log(`📊 Remaining items with null categoryId: ${remainingNullItems}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing categories:', error);
    process.exit(1);
  }
}

fixNullCategories();
