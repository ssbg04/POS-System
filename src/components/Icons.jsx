// components/Icons.jsx
import { FaBox, FaMoneyBillTrendUp, FaComputer } from "react-icons/fa6";
import { MdDashboard, MdInventory } from "react-icons/md";
import { IoMdClipboard, IoMdSettings, IoMdLogOut } from "react-icons/io";

export const ProductsIcon = (props) => <FaBox {...props} />;
export const SalesIcon = (props) => <FaMoneyBillTrendUp {...props} />;
export const ComputerIcon = (props) => <FaComputer {...props} />;
export const DashboardIcon = (props) => <MdDashboard {...props} />;
export const InventoryIcon = (props) => <MdInventory {...props} />;
export const ReportsIcon = (props) => <IoMdClipboard {...props} />;
export const SettingsIcon = (props) => <IoMdSettings {...props} />;
export const LogoutIcon = (props) => <IoMdLogOut {...props} />;

// Optional export object for easy mapping
export const Icons = {
    ProductsIcon,
    SalesIcon,
    ComputerIcon,
    DashboardIcon,
    InventoryIcon,
    ReportsIcon,
    SettingsIcon,
    LogoutIcon,
};
