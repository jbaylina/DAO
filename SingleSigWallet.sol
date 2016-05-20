/*
This file is part of the DAO.

The DAO is free software: you can redistribute it and/or modify
it under the terms of the GNU lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

The DAO is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU lesser General Public License for more details.

You should have received a copy of the GNU lesser General Public License
along with the DAO.  If not, see <http://www.gnu.org/licenses/>.
*/


/*
This wallet is a single proxy.
The idea of this contract is that if can act as a regular account, but it can
allways be transfered/traded as a whole.
This contract can cotains blocket tokens or can be a curator of a split DAO as
an example.
*/

contract SingleSigWallet {
    address owner;

    function SingleSigWallet() {
        owner = msg.sender;
    }

    modifier onlyOwner() {if (msg.sender != owner) throw; _}

    function changeOwner(address _newOwner) onlyOwner {
        owner = _newOwner;
    }

    function call(address _destination, uint32 _value, bytes _data ) onlyOwner {
        _destination.call.value(_value)(_data);
    }
}
