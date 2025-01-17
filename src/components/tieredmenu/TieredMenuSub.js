import React, {Component} from 'react';
import PropTypes from 'prop-types';
import { classNames } from '../utils/ClassNames';
import DomHandler from '../utils/DomHandler';
import { Ripple } from '../ripple/Ripple';

export class TieredMenuSub extends Component {

    static defaultProps = {
        model: null,
        root: false,
        className: null,
        popup: false,
        onLeafClick: null,
        onKeyDown: null,
        parentActive: false
    };

    static propTypes = {
        model: PropTypes.any,
        root: PropTypes.bool,
        className: PropTypes.string,
        popup: PropTypes.bool,
        onLeafClick: PropTypes.func,
        onKeyDown: PropTypes.func,
        parentActive: PropTypes.bool,
        direction: PropTypes.string,
    };

    constructor(props) {
        super(props);
        this.state = {
            activeItem: null
        };

        this.onLeafClick = this.onLeafClick.bind(this);
        this.onChildItemKeyDown = this.onChildItemKeyDown.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (prevProps.parentActive && !this.props.parentActive) {
            this.setState({
                activeItem: null
            });
        }
    }

    componentDidMount() {
        if (!this.documentClickListener) {
            this.documentClickListener = (event) => {
                if (this.element && !this.element.contains(event.target)) {
                    this.setState({activeItem: null});
                }
            };

            document.addEventListener('click', this.documentClickListener);
        }
    }

    componentWillUnmount() {
        if (this.documentClickListener) {
            document.removeEventListener('click', this.documentClickListener);
            this.documentClickListener = null;
        }
    }

    onItemMouseEnter(event, item) {
        if (item.disabled) {
            event.preventDefault();
            return;
        }

        if (this.props.root) {
            if (this.state.activeItem || this.props.popup) {
                this.setState({
                    activeItem: item
                });
            }
        }
        else {
            this.setState({
                activeItem: item
            });
        }
    }

    onItemClick(event, item) {
        if (item.disabled) {
            event.preventDefault();
            return;
        }

        if (!item.url) {
            event.preventDefault();
        }

        if (item.command) {
            item.command({
                originalEvent: event,
                item: item
            });
        }

        if ((item.items?.length ?? 0) > 0) {
            if (this.state.activeItem && item === this.state.activeItem) {
                this.setState({
                    activeItem: null
                });
            }
            else {
                this.setState({
                    activeItem: item
                });
            }
        }

        var target = event.target;
        var isKeyboardEvent = event.clientX === 0 && event.clientY === 0;

        if (isKeyboardEvent) {
            setTimeout(() => {
                var el = target.parentElement.querySelectorAll('.p-submenu-list > .p-menuitem')[0].querySelector('button');

                el.focus();
            }, 0)
        } else if (!item.items) {
            this.onLeafClick();
        }
    }

    onItemKeyDown(event, item) {
        let listItem = event.currentTarget.parentElement;

        switch(event.which) {
            //down
            case 40:
                var nextItem = this.findNextItem(listItem);
                if (nextItem) {
                    nextItem.children[0].focus();
                }

                event.preventDefault();
            break;

            //up
            case 38:
                var prevItem = this.findPrevItem(listItem);
                if (prevItem) {
                    prevItem.children[0].focus();
                }

                event.preventDefault();
            break;

            //right
            case 39:
                if (item.items) {
                    this.setState({
                        activeItem: item
                    });

                    setTimeout(() => {
                        listItem.children[1].children[0].children[0].focus();
                    }, 50);
                }

                event.preventDefault();
            break;

            default:
            break;
        }

        if (this.props.onKeyDown) {
            this.props.onKeyDown(event, listItem);
        }
    }

    onChildItemKeyDown(event, childListItem) {
        var leftArrow = event.which === 37;
        var escape = event.which === 27;

        if (leftArrow || escape) {
            this.setState({activeItem: null});
            childListItem.parentElement.previousElementSibling.focus();
        }
    }

    findNextItem(item) {
        let nextItem = item.nextElementSibling;

        if (nextItem)
            return DomHandler.hasClass(nextItem, 'p-disabled') || !DomHandler.hasClass(nextItem, 'p-menuitem') ? this.findNextItem(nextItem) : nextItem;
        else
            return null;
    }

    findPrevItem(item) {
        let prevItem = item.previousElementSibling;

        if (prevItem)
            return DomHandler.hasClass(prevItem, 'p-disabled') || !DomHandler.hasClass(prevItem, 'p-menuitem') ? this.findPrevItem(prevItem) : prevItem;
        else
            return null;
    }

    onLeafClick() {
        this.setState({
            activeItem: null
        });

        if (this.props.onLeafClick) {
            this.props.onLeafClick();
        }
    }

    renderSeparator(index) {
        return (
            <li key={'separator_' + index} className="p-menu-separator" role="separator"></li>
        );
    }

    renderIcon(item) {
        const className = classNames('p-menuitem-icon', item.icon);

        if (item.icon) {
            return (
                <span className={className}></span>
            );
        }

        return null;
    }

    renderSubmenuIcon(item) {
        if (item.items) {
            return (
                <span className="p-submenu-icon pi pi-angle-right"></span>
            );
        }

        return null;
    }

    renderSubmenu(item) {
        if(item.items) {
            return (
                <TieredMenuSub
                    model={item.items}
                    onLeafClick={this.onLeafClick}
                    popup={this.props.popup}
                    onKeyDown={this.onChildItemKeyDown}
                    parentActive={item === this.state.activeItem}
                    direction={this.props.direction}
                />
            );
        }

        return null;
    }

    renderMenuitem(item, index) {
        const className = classNames('p-menuitem', {'p-menuitem-active': this.state.activeItem === item}, item.className);
        const linkClassName = classNames('p-menuitem-link', {'p-disabled': item.disabled})
        const icon = this.renderIcon(item);
        const submenuIcon = this.renderSubmenuIcon(item);
        const submenu = this.renderSubmenu(item);

        return (
            <li key={item.label + '_' + index} className={className} style={item.style} onMouseEnter={(event) => this.onItemMouseEnter(event, item)} role="none">
                <button className={linkClassName} role="menuitem" aria-haspopup={item.items != null}
                    onClick={(event) => this.onItemClick(event, item)} onKeyDown={(event) => this.onItemKeyDown(event, item)}>
                    {icon}
                    <span className="p-menuitem-text">{item.label}</span>
                    {submenuIcon}
                    <Ripple />
                </button>
                {submenu}
            </li>
        );
    }

    renderItem(item, index) {
        if (item.separator)
            return this.renderSeparator(index);
        else
            return this.renderMenuitem(item, index);
    }

    renderMenu() {
        if (this.props.model) {
            return (
                this.props.model.map((item, index) => {
                    return this.renderItem(item, index);
                })
            );
        }

        return null;
    }

    render() {
        const className = classNames({'p-submenu-list': !this.props.root});
        const submenu = this.renderMenu();

        return (
            <ul
                ref={el => this.element = el}
                className={className}
                role={this.props.root ? 'menubar' : 'menu'}
                aria-orientation="horizontal"
                style={{
                    left: this.props.direction === 'left' ? '-100%' : '100%',
                }}
            >
                {submenu}
            </ul>
        );
    }
}
