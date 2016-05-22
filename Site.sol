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
    This contract is suposed to be used for any site that wants to
    associate userIds with DAO tokens.
*/

contract DAOProxy {
    function balanceOf(address _owner) constant returns (uint256 balance);
}

contract SiteInterface {

    // sha3("")
    bytes32 constant nullUserId = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;

    // address of the DAO (typicaly 0xbb ...)
    address public daoAddress;

    // Name of the site (For reference)
    string public siteName;

    // Url of the site (For reference)
    string public siteUrl;

    // Which accounts are assignated to each user
    mapping(bytes32 => address[]) userAccounts;

    // What user is associated to an account
    mapping(address => bytes32) account2user;

    // Constructor
    // function Site(address _daoAddress, string _siteName, string _siteUrl);

    /// @notice This method will assign msg.sender to the _userId
    /// @param _userId to assign this account. UserId can be the public name or
    /// can be a shared secret identifier betwen the siteOwner and the user.
    function associateAccountToUser(string _userId) returns(bool _success);


    /// @notice Retrieve the total tokens associated to this userId
    /// @param _userId to get the token balance  of
    function getDTHBalanceOfUser(string _userId) constant returns(uint _dthBalance);

    event Association(address indexed _from, bytes32 indexed _userIdHash);

}

contract Site is SiteInterface {

    function Site(address _daoAddress, string _siteName, string _siteUrl) {
        daoAddress = _daoAddress;
        siteName = _siteName;
        siteUrl = _siteUrl;
    }

    function associateAccountToUser(string _userId) returns(bool _success) {
        uint i;
        bytes32 userIdHash = sha3(_userId);
        if (userIdHash == nullUserId) userIdHash = 0;

        bytes32 oldUserIdHash = account2user[msg.sender];

        // Unassign the last assignment
        if ( oldUserIdHash != 0) {
            for (i=0; userAccounts[oldUserIdHash][i] != msg.sender; i++) {}
            userAccounts[oldUserIdHash][i] = userAccounts[oldUserIdHash][userAccounts[oldUserIdHash].length -1];
            userAccounts[oldUserIdHash][userAccounts[oldUserIdHash].length -1] = 0;  // keep the blockchain clean
            userAccounts[oldUserIdHash].length --;
        }

        if (userIdHash != 0) {
            userAccounts[userIdHash][userAccounts[userIdHash].length ++] = msg.sender;
        }

        account2user[msg.sender] = userIdHash;

        Association(msg.sender, userIdHash);

        return true;
    }

    function getDTHBalanceOfUser(string _userId) constant returns(uint _dthBalance) {
        uint acc;
        uint i;

        DAOProxy dao = DAOProxy(daoAddress);

        bytes32 userIdHash = sha3(_userId);

        for (i=0; i<userAccounts[userIdHash].length; i++) {
            acc += dao.balanceOf(userAccounts[userIdHash][i]);
        }

        return acc;
    }
}

