const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-8 px-4">
      <div className="max-w-6xl mx-auto text-center space-y-3">
        <p className="text-lg font-semibold">TestShala</p>
        <p>Contact: info@testshala.com</p>
        <p>Address: New Delhi, India</p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="#" className="hover:text-blue-600 dark:hover:text-white">Facebook</a>
          <a href="#" className="hover:text-blue-600 dark:hover:text-white">Instagram</a>
          <a href="#" className="hover:text-blue-600 dark:hover:text-white">Twitter</a>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">&copy; 2025 TestShala. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
